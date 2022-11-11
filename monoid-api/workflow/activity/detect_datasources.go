package activity

import (
	"context"
	"encoding/json"

	"github.com/brist-ai/monoid/jsonschema"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/google/uuid"
	"github.com/mitchellh/mapstructure"
	"go.temporal.io/sdk/activity"
	"gorm.io/gorm"
)

type dataSourceMatcher struct {
	Group string
	Name  string
}

// getProperties matches newProperties with prevProperties, and returns a merged
// list with all existing properties and new ones.
func getProperties(prevProperties []*model.Property, newProperties map[string]*jsonschema.Schema) []*model.Property {
	propMap := map[string]*model.Property{}
	for _, p := range prevProperties {
		propMap[p.Name] = p
	}

	resPropMap := map[string]*model.Property{}

	// Detect properties in the new list of properties,
	// add them to the result map and mark then as tentatively created.
	for p := range newProperties {
		if prop, ok := propMap[p]; ok {
			resPropMap[prop.Name] = prop
			continue
		}

		c := model.TentativeStatusCreated
		resPropMap[p] = &model.Property{
			ID:        uuid.NewString(),
			Tentative: &c,
			Name:      p,
		}
	}

	// Detect properties that have been removed in the new schema and mark them as tentatively
	// deleted.
	for p := range propMap {
		if _, ok := resPropMap[p]; ok {
			continue
		}

		prop := *propMap[p]
		d := model.TentativeStatusDeleted
		prop.Tentative = &d

		resPropMap[p] = &prop
	}

	resProps := make([]*model.Property, 0, len(resPropMap))

	for _, p := range resPropMap {
		resProps = append(resProps, p)
	}

	return resProps
}

// DetectDSArgs are the arguments passed into a the activity.
type DetectDSArgs struct {
	SiloID string
}

// DetectDataSources scans for the data sources for a data silo.
func (a *Activity) DetectDataSources(ctx context.Context, args DetectDSArgs) error {
	logger := activity.GetLogger(ctx)

	dataSilo := model.SiloDefinition{}
	if err := a.Conf.DB.Preload("SiloSpecification").Where("id = ?", args.SiloID).First(&dataSilo).Error; err != nil {
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

	updateDataSources := make([]model.DataSource, 0, len(schemas.Schemas))
	createDataSources := make([]model.DataSource, 0, len(schemas.Schemas))

	logger.Info("Schemas", schemas.Schemas, sourceMap, len(sourceMap), len(sources))

	for _, schema := range schemas.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}

		currSource, shouldUpdate := sourceMap[dataSourceMatcher{
			Name:  schema.Name,
			Group: group,
		}]

		if !shouldUpdate {
			currSource = &model.DataSource{
				ID:               uuid.NewString(),
				Group:            schema.Group,
				Name:             schema.Name,
				SiloDefinitionID: dataSilo.ID,
			}
		}

		parsedSchema := jsonschema.Schema{}
		err := mapstructure.Decode(schema.JsonSchema, &parsedSchema)
		if err != nil {
			logger.Error("Error decoding schema: %v", err)
			continue
		}

		props := getProperties(currSource.Properties, parsedSchema.Properties)
		currSource.Properties = props

		schemaStr, err := json.Marshal(schema.JsonSchema)
		if err != nil {
			logger.Error("Error marshalling schema: %v", err)
			continue
		}

		currSource.Schema = string(schemaStr)

		if shouldUpdate {
			updateDataSources = append(updateDataSources, *currSource)
		} else {
			createDataSources = append(createDataSources, *currSource)
		}
	}

	logger.Info("Data sources", updateDataSources, createDataSources)

	a.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if len(createDataSources) != 0 {
			if err := tx.Create(&createDataSources).Error; err != nil {
				return err
			}
		}

		for _, u := range updateDataSources {
			if err := tx.Omit("Properties").Updates(&u).Error; err != nil {
				return err
			}

			if err := tx.Model(&u).Association("Properties").Replace(&u.Properties); err != nil {
				return err
			}
		}

		return nil
	})

	return nil
}
