package activity

import (
	"context"
	"encoding/json"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/google/uuid"
	"go.temporal.io/sdk/activity"
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

	dataSources := make([]model.DataSource, 0, len(schemas.Schemas))

	logger.Info("Schemas", schemas.Schemas)

	for _, schema := range schemas.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}

		currSource, ok := sourceMap[dataSourceMatcher{
			Name:  schema.Name,
			Group: group,
		}]

		if !ok {
			currSource = &model.DataSource{
				ID:    uuid.NewString(),
				Group: schema.Group,
				Name:  schema.Name,
			}
		}

		schema, err := json.Marshal(schema.JsonSchema)
		if err != nil {
			logger.Error("Error parsing schema: %v", err)
			continue
		}

		currSource.Schema = string(schema)

		dataSources = append(dataSources, *currSource)
	}

	// TODO: If data sources are deleted here, they can't just be cleared,
	// has to be some way of notifying ppl of that happening (tombstoning the source)
	// before it goes away.
	if err := a.Conf.DB.Model(&dataSiloDef).Association("DataSources").Replace(&dataSources); err != nil {
		return err
	}

	return nil
}
