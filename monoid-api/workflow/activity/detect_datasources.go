package activity

import (
	"context"
	"encoding/json"

	"github.com/brist-ai/monoid/jsonschema"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/google/uuid"
	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
	"go.temporal.io/sdk/activity"
	"gorm.io/gorm"
)

type dataSourceMatcher struct {
	Group string
	Name  string
}

// getPropertyDiscoveries matches newProperties with prevProperties, and returns a
// list with all the discoveries.
func getPropertyDiscoveries(
	prevProperties []*model.Property,
	newProperties map[string]*jsonschema.Schema,
	sourceID *string,
) []*model.DataDiscovery {
	propMap := map[string]*model.Property{}
	for _, p := range prevProperties {
		propMap[p.Name] = p
	}

	resPropMap := map[string]*model.DataDiscovery{}

	// Detect properties in the new list of properties,
	// add them to the result map and mark then as tentatively created.
	for p := range newProperties {
		if prop, ok := propMap[p]; ok {
			resPropMap[prop.Name] = nil
			continue
		}

		data, err := json.Marshal(model.NewPropertyDiscovery{
			Name:         p,
			DataSourceId: sourceID,
		})

		if err != nil {
			continue
		}

		resPropMap[p] = &model.DataDiscovery{
			ID:     uuid.NewString(),
			Type:   model.DiscoveryTypePropertyFound,
			Status: model.DiscoveryStatusOpen,
			Data:   data,
		}
	}

	// Detect properties that have been removed in the new schema and mark them as
	// deleted.
	for p := range propMap {
		if _, ok := resPropMap[p]; ok {
			continue
		}

		delObj := model.ObjectMissingDiscovery{
			ID: p,
		}

		delObjJSON, err := json.Marshal(delObj)
		if err != nil {
			continue
		}

		resPropMap[p] = &model.DataDiscovery{
			ID:     uuid.NewString(),
			Type:   model.DiscoveryTypePropertyMissing,
			Status: model.DiscoveryStatusOpen,
			Data:   delObjJSON,
		}
	}

	res := make([]*model.DataDiscovery, 0, len(resPropMap))

	for _, p := range resPropMap {
		if p == nil {
			continue
		}

		res = append(res, p)
	}

	return res
}

// processDiscoveries processes the list of new discoveries, eliminating any duplicates,
// updating them instead of creating, and closing any discoveries that are no longer relevant.
func processDiscoveries(db *gorm.DB, silo *model.SiloDefinition, discoveries []*model.DataDiscovery) error {
	openDiscoveries := []*model.DataDiscovery{}
	if err := db.Where("silo_definition_id = ?", silo.ID).Where(
		"status = ?",
		model.DiscoveryStatusOpen,
	).Find(&openDiscoveries).Error; err != nil {
		return err
	}

	type discoveryKey struct {
		Type model.DiscoveryType
		Data interface{}
	}

	discoveryMap := map[interface{}]*model.DataDiscovery{}
	for _, d := range openDiscoveries {
		ds, err := d.DeserializeData()
		if err != nil {
			log.Err(err).Msg("Error deserializing data")
			continue
		}

		discoveryMap[discoveryKey{
			Data: ds.Mappable(),
			Type: d.Type,
		}] = d
	}

	return db.Transaction(func(tx *gorm.DB) error {
		currDiscoveries := map[interface{}]bool{}

		for _, d := range discoveries {
			ds, err := d.DeserializeData()
			if err != nil {
				log.Err(err).Msg("Error deserializing data")
				continue
			}

			k := discoveryKey{
				Data: ds.Mappable(),
				Type: d.Type,
			}

			currDiscoveries[k] = true
			oldDiscovery, ok := discoveryMap[k]

			// If this is a new discovery, then just create it
			if !ok {
				if err := db.Model(&silo).Association("DataDiscoveries").Append(d); err != nil {
					return err
				}

				continue
			}

			// If this is an old discovery, then update it's data.
			if err := db.Model(oldDiscovery).Updates(model.DataDiscovery{
				Data: d.Data,
			}).Error; err != nil {
				return err
			}
		}

		// If any currently open discovery no longer has a corresponding discovery in
		// the new list of discoveries, then we assume that the change has been reversed.
		// In order to maintain an appropriate audit trail, the discovery is closed, and
		// rejected. This does not happen for category-related discoveries, since those
		// may be non-deterministic based on the scan.
		for _, d := range openDiscoveries {
			ds, err := d.DeserializeData()
			if err != nil {
				log.Err(err).Msg("Error deserializing data")
				continue
			}

			_, ok := currDiscoveries[discoveryKey{
				Data: ds.Mappable(),
				Type: d.Type,
			}]

			if ok || d.Type == model.DiscoveryTypeCategoryFound {
				continue
			}

			if err := db.Model(d).Update("status", model.DiscoveryStatusRejected).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// DetectDSArgs are the arguments passed into a the activity.
type DetectDSArgs struct {
	SiloID string
}

// DetectDataSources scans for the data sources for a data silo.
func (a *Activity) DetectDataSources(ctx context.Context, args DetectDSArgs) error {
	logger := activity.GetLogger(ctx)

	dataSilo := model.SiloDefinition{}
	if err := a.Conf.DB.Preload(
		"SiloSpecification",
	).Where("id = ?", args.SiloID).First(&dataSilo).Error; err != nil {
		return err
	}

	logger.Info("Getting schemas")

	mp, err := docker.NewDockerMP(
		dataSilo.SiloSpecification.DockerImage,
		dataSilo.SiloSpecification.DockerTag,
	)
	if err != nil {
		logger.Error("Error creating docker client: %v", err)
		return err
	}

	defer mp.Teardown(ctx)

	if err := mp.InitConn(ctx); err != nil {
		logger.Error("Error creating docker connection: %v", err)
		return err
	}

	conf := map[string]interface{}{}
	json.Unmarshal([]byte(dataSilo.Config), &conf)

	logger.Info("pulling schema")

	schemas, err := mp.Schema(ctx, conf)

	if err != nil {
		logger.Error("Error running schema: %v", err)
		return err
	}

	// Get all the data sources (with properties) that currently exist
	// for this silo.
	sources := []model.DataSource{}
	if err := a.Conf.DB.Preload("Properties").Where(
		"silo_definition_id = ?", dataSilo.ID,
	).Find(&sources).Error; err != nil {
		logger.Error("Error getting silo def %v", err)
		return err
	}

	// Detect the new data sources.
	sourceMap := map[dataSourceMatcher]*model.DataSource{}
	for _, s := range sources {
		group := ""
		if s.Group != nil {
			group = *s.Group
		}

		scp := s
		sourceMap[dataSourceMatcher{
			Group: group,
			Name:  s.Name,
		}] = &scp
	}

	dataDiscoveries := []*model.DataDiscovery{}

	// The data sources that are in the new schemas
	currDataSources := map[string]bool{}

	logger.Info("Schemas", schemas.Schemas, sourceMap, len(sourceMap), len(sources))

	for _, schema := range schemas.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}

		currSource, ok := sourceMap[dataSourceMatcher{
			Name:  schema.Name,
			Group: group,
		}]

		parsedSchema := jsonschema.Schema{}
		err := mapstructure.Decode(schema.JsonSchema, &parsedSchema)
		if err != nil {
			logger.Error("Error decoding schema: %v", err)
			continue
		}

		if ok {
			propDiscoveries := getPropertyDiscoveries(
				currSource.Properties,
				parsedSchema.Properties,
				&currSource.ID,
			)

			dataDiscoveries = append(dataDiscoveries, propDiscoveries...)

			currDataSources[currSource.ID] = true

			continue
		}

		properties := []model.NewPropertyDiscovery{}
		for p := range parsedSchema.Properties {
			properties = append(properties, model.NewPropertyDiscovery{
				Name: p,
			})
		}

		sourceData, err := json.Marshal(model.NewDataSourceDiscovery{
			Group:      schema.Group,
			Name:       schema.Name,
			Properties: properties,
		})

		if err != nil {
			continue
		}

		dataDiscoveries = append(dataDiscoveries, &model.DataDiscovery{
			ID:     uuid.NewString(),
			Type:   model.DiscoveryTypeDataSourceFound,
			Status: model.DiscoveryStatusOpen,
			Data:   sourceData,
		})
	}

	for _, s := range sources {
		if _, ok := currDataSources[s.ID]; ok {
			continue
		}

		delObj := model.ObjectMissingDiscovery{
			ID: s.ID,
		}

		delObjJSON, err := json.Marshal(delObj)
		if err != nil {
			continue
		}

		dataDiscoveries = append(dataDiscoveries, &model.DataDiscovery{
			Data:   delObjJSON,
			ID:     uuid.NewString(),
			Type:   model.DiscoveryTypeDataSourceMissing,
			Status: model.DiscoveryStatusOpen,
		})
	}

	if err := processDiscoveries(a.Conf.DB, &dataSilo, dataDiscoveries); err != nil {
		return err
	}

	return nil
}
