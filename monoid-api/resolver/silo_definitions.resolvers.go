package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/jsonschema"
	"github.com/monoid-privacy/monoid/loader"
	"github.com/monoid-privacy/monoid/model"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"gorm.io/gorm/clause"
)

// CreateSiloDefinition is the resolver for the createSiloDefinition field.
func (r *mutationResolver) CreateSiloDefinition(ctx context.Context, input *model.CreateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{
		ID:                  uuid.NewString(),
		Name:                input.Name,
		WorkspaceID:         input.WorkspaceID,
		Description:         input.Description,
		SiloSpecificationID: input.SiloSpecificationID,
	}

	if input.SiloData != nil {
		siloDefinition.Config = model.SecretString(*input.SiloData)
	}

	siloSpec := model.SiloSpecification{}
	if err := r.Conf.DB.Where("id = ?", siloDefinition.SiloSpecificationID).First(&siloSpec).Error; err != nil {
		return nil, handleError(err, "Silo specification doesn't exist.")
	}

	siloDefinition.SiloSpecification = siloSpec

	res, err := r.validateSiloDef(
		ctx,
		fmt.Sprintf("ws-%s/silo-%s-%s", input.WorkspaceID, siloSpec.DockerImage, siloDefinition.ID),
		siloDefinition,
	)

	analyticsData := map[string]interface{}{
		"action": "create",
		"siloId": siloDefinition.ID,
	}

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
		analyticsData["action"] = "create_validate_failed"
		r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

		return nil, gqlerror.Errorf(res.message)
	}

	if err := r.Conf.DB.Create(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error creating silo definition.")
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Find(&subjects).Error; err != nil {
		return nil, handleError(err, "Error finding subjects.")
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Append(subjects); err != nil {
		return nil, handleError(err, "Error creating subjects.")
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	return &siloDefinition, nil
}

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{}

	if err := r.Conf.DB.Where(
		"id = ?",
		input.ID,
	).Preload("SiloSpecification").First(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if input.Name != nil {
		siloDefinition.Name = *input.Name
	}

	siloDefinition.Description = input.Description

	if input.SiloData != nil {
		data := map[string]interface{}{}
		if err := json.Unmarshal([]byte(*input.SiloData), &data); err != nil {
			return nil, handleError(err, "Invalid config.")
		}

		oldData := map[string]interface{}{}
		if err := json.Unmarshal([]byte(siloDefinition.Config), &oldData); err != nil {
			log.Err(err).Msg("Error unmarshalling old config.")
		}

		schemaStr := siloDefinition.SiloSpecification.Schema
		if schemaStr != nil {
			schema := jsonschema.Schema{}
			if err := json.Unmarshal([]byte(*schemaStr), &schema); err != nil {
				return nil, handleError(err, "Could not parse schema.")
			}

			res := jsonschema.MergeData(oldData, data, &schema)

			resJSON, err := json.Marshal(&res)
			if err != nil {
				return nil, handleError(err, "Could not validate config.")
			}

			siloDefinition.Config = model.SecretString(resJSON)
		} else {
			siloDefinition.Config = model.SecretString(*input.SiloData)
		}
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Where(
		"workspace_id = ?", siloDefinition.WorkspaceID,
	).Find(&subjects).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	analyticsData := map[string]interface{}{
		"action": "update",
		"siloId": siloDefinition.ID,
	}

	// Validate the definition before saving it
	res, err := r.validateSiloDef(
		ctx,
		fmt.Sprintf(
			"ws-%s/silo-%s-%s",
			siloDefinition.WorkspaceID,
			siloDefinition.SiloSpecification.DockerImage,
			siloDefinition.ID,
		),
		siloDefinition,
	)

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
		analyticsData["action"] = "update_validate_failed"
		r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)
		return nil, gqlerror.Errorf(res.message)
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Replace(subjects); err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	if err := r.Conf.DB.Omit("Subjects").Updates(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	return &siloDefinition, nil
}

// DeleteSiloDefinition is the resolver for the deleteSiloDefinition field.
func (r *mutationResolver) DeleteSiloDefinition(ctx context.Context, id string) (*string, error) {
	siloDefinition := &model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", id).Preload("Subjects").Preload("DataSources").First(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if err := r.Conf.DB.Delete(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error deleting silo definition.")
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, map[string]interface{}{
		"action": "delete",
		"siloId": id,
	})

	// TODO: Check that deletes properly cascade to subjects (m2m) and datasources (12m)

	return &id, nil
}

// SiloDefinition is the resolver for the siloDefinition field.
func (r *queryResolver) SiloDefinition(ctx context.Context, id string) (*model.SiloDefinition, error) {
	silo := &model.SiloDefinition{}
	if err := r.Conf.DB.Where(
		"id = ?",
		id,
	).First(silo).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	return silo, nil
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *siloDefinitionResolver) SiloSpecification(ctx context.Context, obj *model.SiloDefinition) (*model.SiloSpecification, error) {
	return loader.SiloSpecification(ctx, obj.SiloSpecificationID)
}

// DataSources is the resolver for the dataSources field.
func (r *siloDefinitionResolver) DataSources(ctx context.Context, obj *model.SiloDefinition) ([]*model.DataSource, error) {
	sources := []*model.DataSource{}
	if err := r.Conf.DB.Where(
		"silo_definition_id = ?", obj.ID,
	).Order(clause.OrderByColumn{Column: clause.Column{Name: "group"}}).Order(
		clause.OrderByColumn{Column: clause.Column{Name: "name"}},
	).Find(&sources).Error; err != nil {
		return nil, handleError(err, "Error finding data sources")
	}

	return sources, nil
}

// SiloConfig is the resolver for the siloConfig field.
func (r *siloDefinitionResolver) SiloConfig(ctx context.Context, obj *model.SiloDefinition) (map[string]interface{}, error) {
	siloSpec := model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", obj.SiloSpecificationID).First(&siloSpec).Error; err != nil {
		return nil, err
	}

	res := map[string]interface{}{}
	if err := json.Unmarshal([]byte(obj.Config), &res); err != nil {
		return nil, handleError(err, "Error decoding config.")
	}

	if siloSpec.Schema == nil {
		return res, nil
	}

	schema := jsonschema.Schema{}
	if err := json.Unmarshal([]byte(*siloSpec.Schema), &schema); err != nil {
		return nil, handleError(err, "Could not parse schema.")
	}

	jsonschema.HideSecrets(res, &schema)

	return res, nil
}

// SiloDefinitions is the resolver for the siloDefinitions field.
func (r *workspaceResolver) SiloDefinitions(ctx context.Context, obj *model.Workspace) ([]*model.SiloDefinition, error) {
	defs := []*model.SiloDefinition{}
	if err := r.Conf.DB.Model(obj).Association("SiloDefinitions").Find(&defs); err != nil {
		return nil, handleError(err, "Error getting definitions.")
	}

	return defs, nil
}

// SiloDefinition returns generated.SiloDefinitionResolver implementation.
func (r *Resolver) SiloDefinition() generated.SiloDefinitionResolver {
	return &siloDefinitionResolver{r}
}

type siloDefinitionResolver struct{ *Resolver }
