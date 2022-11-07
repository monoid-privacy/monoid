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

func (a *Activity) DetectDataSources(ctx context.Context, dataSiloDef model.SiloDefinition) error {
	logger := activity.GetLogger(ctx)

	logger.Info("Getting schemas")

	spec := dataSiloDef.SiloSpecification
	mp, err := docker.NewDockerMP(spec.DockerImage, spec.DockerTag)
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
	json.Unmarshal([]byte(dataSiloDef.Config), &conf)

	logger.Info("pulling schema")

	schemas, err := mp.Schema(ctx, conf)

	if err != nil {
		logger.Error("Error running schema: %v", err)
		return err
	}

	sources := []model.DataSource{}
	if err := a.Conf.DB.Where("silo_definition_id = ?", dataSiloDef.ID).Find(&sources).Error; err != nil {
		logger.Error("Error getting silo def %v", err)
		return err
	}

	sourceMap := map[dataSourceMatcher]*model.DataSource{}
	for _, s := range sources {
		group := ""
		if s.Group != nil {
			group = *s.Group
		}

		sourceMap[dataSourceMatcher{
			Group: group,
			Name:  s.Name,
		}] = &s
	}

	updateDataSources := make([]model.DataSource, 0, len(schemas.Schemas))
	createDataSources := make([]model.DataSource, 0, len(schemas.Schemas))

	logger.Info("Schemas", schemas.Schemas, sourceMap, len(sourceMap), len(sources), dataSiloDef.ID)

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
				SiloDefinitionID: dataSiloDef.ID,
			}
		}

		parsedSchema := jsonschema.Schema{}
		err := mapstructure.Decode(schema.JsonSchema, &parsedSchema)
		if err != nil {
			logger.Error("Error decoding schema: %v", err)
			continue
		}

		props := []*model.Property{}

		for name := range parsedSchema.Properties {
			props = append(props, &model.Property{
				ID:   uuid.NewString(),
				Name: name,
			})
		}

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

	a.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if len(createDataSources) != 0 {
			if err := tx.Create(&createDataSources).Error; err != nil {
				return err
			}
		}

		for _, u := range updateDataSources {
			if err := tx.Updates(&u).Error; err != nil {
				return err
			}
		}

		return nil
	})

	return nil
}
