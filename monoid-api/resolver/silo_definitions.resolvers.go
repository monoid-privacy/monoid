package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
	"github.com/vektah/gqlparser/v2/gqlerror"
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

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
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

	return &siloDefinition, nil
}

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{}

	if err := r.Conf.DB.Where(
		"id = ?",
		input.ID,
	).Where(
		"workspace_id = ?",
		input.WorkspaceID,
	).Preload("SiloSpecification").First(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if input.Name != nil {
		siloDefinition.Name = *input.Name
	}

	siloDefinition.Description = input.Description

	if input.SiloData != nil {
		siloDefinition.Config = model.SecretString(*input.SiloData)
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Find(&subjects).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	// Validate the definition before saving it
	res, err := r.validateSiloDef(
		ctx,
		fmt.Sprintf(
			"ws-%s/silo-%s-%s",
			input.WorkspaceID,
			siloDefinition.SiloSpecification.DockerImage,
			siloDefinition.ID,
		),
		siloDefinition,
	)

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
		return nil, gqlerror.Errorf(res.message)
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Replace(subjects); err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	if err := r.Conf.DB.Omit("Subjects").Updates(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

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

	// TODO: Check that deletes properly cascade to subjects (m2m) and datasources (12m)

	return &id, nil
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *siloDefinitionResolver) SiloSpecification(ctx context.Context, obj *model.SiloDefinition) (*model.SiloSpecification, error) {
	spec := model.SiloSpecification{}
	if err := r.Conf.DB.Where(
		"id = ?",
		obj.SiloSpecificationID,
	).First(&spec).Error; err != nil {
		return nil, handleError(err, "Error finding specifications")
	}

	return &spec, nil
}

// SiloConfig is the resolver for the siloConfig field.
func (r *siloDefinitionResolver) SiloConfig(ctx context.Context, obj *model.SiloDefinition) (map[string]interface{}, error) {
	res := map[string]interface{}{}
	if err := json.Unmarshal([]byte(obj.Config), &res); err != nil {
		return nil, handleError(err, "Error decoding config")
	}

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

// SiloDefinition is the resolver for the siloDefinition field.
func (r *workspaceResolver) SiloDefinition(ctx context.Context, obj *model.Workspace, id string) (*model.SiloDefinition, error) {
	silo := &model.SiloDefinition{}
	if err := r.Conf.DB.Where(
		"id = ?",
		id,
	).Where("workspace_id = ?", obj.ID).First(silo).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	return silo, nil
}

// SiloDefinition returns generated.SiloDefinitionResolver implementation.
func (r *Resolver) SiloDefinition() generated.SiloDefinitionResolver {
	return &siloDefinitionResolver{r}
}

type siloDefinitionResolver struct{ *Resolver }
