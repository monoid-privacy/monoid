package activity

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"os"
	"time"

	"github.com/brist-ai/monoid/jsonschema"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/scanner"
	"github.com/brist-ai/monoid/scanner/basicscanner"

	"github.com/google/uuid"
	"github.com/mitchellh/mapstructure"
	"go.temporal.io/sdk/activity"
	"gorm.io/gorm"
)

func dedupCategories(
	propertyID string,
	prevCategories []*model.Category,
	newCategories []model.NewCategoryDiscovery,
) []*model.DataDiscovery {
	categoryMap := map[string]*model.Category{}
	for _, c := range prevCategories {
		categoryMap[c.ID] = c
	}

	res := []*model.DataDiscovery{}

	for _, cat := range newCategories {
		if _, ok := categoryMap[cat.CategoryID]; ok {
			continue
		}

		data, err := json.Marshal(model.NewCategoryDiscovery{
			PropertyID: &propertyID,
			CategoryID: cat.CategoryID,
		})

		if err != nil {
			continue
		}

		discovery := model.DataDiscovery{
			ID:     uuid.NewString(),
			Type:   model.DiscoveryTypeCategoryFound,
			Status: model.DiscoveryStatusOpen,
			Data:   data,
		}

		res = append(res, &discovery)
	}

	return res
}

// getPropertyDiscoveries matches newProperties with prevProperties, and returns a
// list with all the discoveries.
func getPropertyDiscoveries(
	prevProperties []*model.Property,
	newProperties map[string]*jsonschema.Schema,
	categoryMatches map[DataSourceMatcher]map[string][]scanner.RuleMatch,
	dataSource *model.DataSource,
) []*model.DataDiscovery {
	propMap := map[string]*model.Property{}
	for _, p := range prevProperties {
		propMap[p.Name] = p
	}

	resPropMap := map[string]*model.DataDiscovery{}
	res := []*model.DataDiscovery{}

	// Detect properties in the new list of properties,
	// add them to the result map and mark then as tentatively created.
	for p := range newProperties {
		if prop, ok := propMap[p]; ok {
			resPropMap[prop.Name] = nil

			// Create the discoveries for the updated categories for new properties.
			cats := getCategories(
				categoryMatches,
				NewDataSourceMatcher(dataSource.Name, dataSource.Group),
				p,
			)

			newCats := dedupCategories(prop.ID, prop.Categories, cats)
			res = append(res, newCats...)

			continue
		}

		// Process the new property.
		cats := getCategories(
			categoryMatches,
			NewDataSourceMatcher(dataSource.Name, dataSource.Group),
			p,
		)

		data, err := json.Marshal(model.NewPropertyDiscovery{
			Name:         p,
			DataSourceId: &dataSource.ID,
			Categories:   cats,
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
	for p, v := range propMap {
		if _, ok := resPropMap[p]; ok {
			continue
		}

		delObj := model.PropertyMissingDiscovery{
			ID: v.ID,
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
// Returns the number of new discoveries made.
func processDiscoveries(
	ctx context.Context,
	db *gorm.DB,
	silo *model.SiloDefinition,
	discoveries []*model.DataDiscovery,
) (int, error) {
	logger := activity.GetLogger(ctx)

	openDiscoveries := []*model.DataDiscovery{}
	if err := db.Where("silo_definition_id = ?", silo.ID).Where(
		"status = ?",
		model.DiscoveryStatusOpen,
	).Find(&openDiscoveries).Error; err != nil {
		return 0, err
	}

	type discoveryKey struct {
		Type model.DiscoveryType
		Data interface{}
	}

	discoveryMap := map[interface{}]*model.DataDiscovery{}
	for _, d := range openDiscoveries {
		ds, err := d.DeserializeData()
		if err != nil {
			logger.Error("Error deserializing data: %v", err)
			continue
		}

		discoveryMap[discoveryKey{
			Data: ds.Mappable(),
			Type: d.Type,
		}] = d
	}

	nDiscoveries := 0

	if err := db.Transaction(func(tx *gorm.DB) error {
		currDiscoveries := map[interface{}]bool{}

		for _, d := range discoveries {
			ds, err := d.DeserializeData()
			if err != nil {
				logger.Error("Error deserializing data: %v", err)
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

				nDiscoveries += 1
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
				logger.Error("Error deserializing data: %v", err)
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
	}); err != nil {
		return 0, err
	}

	return nDiscoveries, nil
}

// getCategories finds the new category discoveries from the
// result of scanProtocol and the data source and
// property names.
func getCategories(
	matches map[DataSourceMatcher]map[string][]scanner.RuleMatch,
	source DataSourceMatcher,
	propertyName string,
) []model.NewCategoryDiscovery {
	catMatcher, ok := matches[source]

	if ok {
		matches, pok := catMatcher[propertyName]

		if pok {
			res := make([]model.NewCategoryDiscovery, len(matches))

			for i, m := range matches {
				res[i] = model.NewCategoryDiscovery{
					CategoryID: m.RuleName,
				}
			}

			return res
		}
	}

	return []model.NewCategoryDiscovery{}
}

// scanProtocol runs the PII scan using the monoid protocol,
// and returns a 2D map, the first dimension of which is a DataSourceMatcher
// key, and the second of which has the property path as a key.
func scanProtocol(
	ctx context.Context,
	mp monoidprotocol.MonoidProtocol,
	config map[string]interface{},
	schemas []monoidprotocol.MonoidSchema,
) (map[DataSourceMatcher]map[string][]scanner.RuleMatch, error) {
	logger := activity.GetLogger(ctx)
	matchers := map[DataSourceMatcher]scanner.Scanner{}
	for _, s := range schemas {
		sc, err := basicscanner.NewBasicScanner(s)

		if err != nil {
			return nil, err
		}

		matchers[NewDataSourceMatcher(s.Name, s.Group)] = sc
	}

	recordChan, err := mp.Scan(
		ctx,
		config,
		monoidprotocol.MonoidSchemasMessage{Schemas: schemas},
	)

	if err != nil {
		return nil, err
	}

	for record := range recordChan {
		matcher := matchers[NewDataSourceMatcher(
			record.SchemaName,
			record.SchemaGroup,
		)]

		if err := matcher.Scan(&record); err != nil {
			logger.Error("Error scanning record: %v", err)
		}
	}

	res := map[DataSourceMatcher]map[string][]scanner.RuleMatch{}
	for k, v := range matchers {
		if _, ok := res[k]; !ok {
			res[k] = map[string][]scanner.RuleMatch{}
		}

		for _, match := range v.Summary() {
			if _, ok := res[k][match.Identifier]; !ok {
				res[k][match.Identifier] = []scanner.RuleMatch{}
			}

			res[k][match.Identifier] = append(res[k][match.Identifier], match)
		}
	}

	return res, nil
}

// DetectDSArgs are the arguments passed into a the activity.
type DetectDSArgs struct {
	SiloID        string
	LogObjectName string
}

// DetectDataSources scans for the data sources for a data silo, and returns the number of
// discoveries that were made.
func (a *Activity) DetectDataSources(ctx context.Context, args DetectDSArgs) (int, error) {
	logger := activity.GetLogger(ctx)
	go func() {
		ticker := time.NewTicker(1 * time.Second)

	L:
		for {
			select {
			case <-ticker.C:
				activity.RecordHeartbeat(ctx)
			case <-ctx.Done():
				logger.Info("Activity cancelled")
				break L
			}
		}
	}()

	dataSilo := model.SiloDefinition{}
	if err := a.Conf.DB.Preload(
		"SiloSpecification",
	).Where("id = ?", args.SiloID).First(&dataSilo).Error; err != nil {
		return 0, err
	}

	logger.Info("Getting schemas")

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
	if err != nil {
		return 0, err
	}

	defer os.RemoveAll(dir)

	mp, err := a.Conf.ProtocolFactory.NewMonoidProtocol(
		dataSilo.SiloSpecification.DockerImage,
		dataSilo.SiloSpecification.DockerTag,
		dir,
	)

	if err != nil {
		logger.Error("Error creating docker client: %v", err)
		return 0, err
	}

	defer mp.Teardown(ctx)

	logChan, err := mp.AttachLogs(ctx)
	if err != nil {
		logger.Error("Error attaching logs: %v", err)
		return 0, err
	}

	go func() {
		wr, _, err := a.Conf.FileStore.NewWriter(ctx, args.LogObjectName, true)
		if err != nil {
			logger.Error("Error opening log writer: %v", err)
		}

	L:
		for {
			select {
			case logMsg, ok := <-logChan:
				if !ok {
					break L
				}

				if _, err := wr.Write([]byte(logMsg.Message + "\n")); err != nil {
					logger.Error("Error writing", err)
				}
			case <-ctx.Done():
				logger.Info("Task Cancelled")

				if _, err := wr.Write([]byte("Task cancelled\n")); err != nil {
					logger.Error("Error writing", err)
				}

				break L
			}
		}

		logger.Debug("Close")
		wr.Close()
	}()

	if err := mp.InitConn(ctx); err != nil {
		logger.Error("Error creating docker connection: %v", err)
		return 0, err
	}

	conf := map[string]interface{}{}
	json.Unmarshal([]byte(dataSilo.Config), &conf)

	logger.Info("pulling schema")

	schemas, err := mp.Schema(ctx, conf)

	if err != nil {
		logger.Error("Error running schema: %v", err)
		return 0, err
	}

	matches, err := scanProtocol(ctx, mp, conf, schemas.Schemas)
	if err != nil {
		logger.Error("Error running scan: %v", err)
		return 0, err
	}

	// Get all the data sources (with properties) that currently exist
	// for this silo.
	sources := []model.DataSource{}
	if err := a.Conf.DB.Preload("Properties").Preload("Properties.Categories").Where(
		"silo_definition_id = ?", dataSilo.ID,
	).Find(&sources).Error; err != nil {
		logger.Error("Error getting silo def %v", err)
		return 0, err
	}

	// Detect the new data sources.
	sourceMap := map[DataSourceMatcher]*model.DataSource{}
	for _, s := range sources {
		scp := s
		sourceMap[NewDataSourceMatcher(s.Name, s.Group)] = &scp
	}

	dataDiscoveries := []*model.DataDiscovery{}

	// The data sources that are in the new schemas
	currDataSources := map[string]bool{}

	logger.Info("Schemas", schemas.Schemas, sourceMap, len(sourceMap), len(sources))

	for _, schema := range schemas.Schemas {
		sourceMatcher := NewDataSourceMatcher(
			schema.Name,
			schema.Group,
		)
		currSource, ok := sourceMap[sourceMatcher]

		parsedSchema := jsonschema.Schema{}
		err := mapstructure.Decode(schema.JsonSchema, &parsedSchema)
		if err != nil {
			logger.Error("Error decoding schema: %v", err)
			continue
		}

		// Process just the properties if the data source already exists.
		if ok {
			propDiscoveries := getPropertyDiscoveries(
				currSource.Properties,
				parsedSchema.Properties,
				matches,
				currSource,
			)

			dataDiscoveries = append(dataDiscoveries, propDiscoveries...)

			currDataSources[currSource.ID] = true

			continue
		}

		// If the data source doesn't exist, create the properties manually,
		// and add the new data source discovery.
		properties := []model.NewPropertyDiscovery{}
		for p := range parsedSchema.Properties {
			discovery := model.NewPropertyDiscovery{
				Name:       p,
				Categories: getCategories(matches, sourceMatcher, p),
			}

			properties = append(properties, discovery)
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

		delObj := model.DataSourceMissingDiscovery{
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

	nDiscoveries, err := processDiscoveries(ctx, a.Conf.DB, &dataSilo, dataDiscoveries)
	if err != nil {
		return 0, err
	}

	return nDiscoveries, nil
}
