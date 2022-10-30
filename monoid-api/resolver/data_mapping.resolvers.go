package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// CreateSiloDefinition is the resolver for the createSiloDefinition field.
func (r *mutationResolver) CreateSiloDefinition(ctx context.Context, input *model.CreateSiloDefinitionInput) (*model.SiloDefinition, error) {
	panic(fmt.Errorf("not implemented: CreateSiloDefinition - createSiloDefinition"))
}

// CreateDatapoint is the resolver for the createDatapoint field.
func (r *mutationResolver) CreateDatapoint(ctx context.Context, input *model.CreateDatapointInput) (*model.Datapoint, error) {
	panic(fmt.Errorf("not implemented: CreateDatapoint - createDatapoint"))
}

// CreateSiloSpecification is the resolver for the createSiloSpecification field.
func (r *mutationResolver) CreateSiloSpecification(ctx context.Context, input *model.CreateSiloSpecificationInput) (*model.SiloSpecification, error) {
	panic(fmt.Errorf("not implemented: CreateSiloSpecification - createSiloSpecification"))
}

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	panic(fmt.Errorf("not implemented: UpdateSiloDefinition - updateSiloDefinition"))
}

// UpdateDatapoint is the resolver for the updateDatapoint field.
func (r *mutationResolver) UpdateDatapoint(ctx context.Context, input *model.UpdateDatapointInput) (*model.Datapoint, error) {
	panic(fmt.Errorf("not implemented: UpdateDatapoint - updateDatapoint"))
}

// UpdateSiloSpecification is the resolver for the updateSiloSpecification field.
func (r *mutationResolver) UpdateSiloSpecification(ctx context.Context, input *model.UpdateSiloSpecificationInput) (*model.SiloSpecification, error) {
	panic(fmt.Errorf("not implemented: UpdateSiloSpecification - updateSiloSpecification"))
}

// DeleteSiloDefinition is the resolver for the deleteSiloDefinition field.
func (r *mutationResolver) DeleteSiloDefinition(ctx context.Context, id string) (*string, error) {
	siloDefinition := &model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", id).First(siloDefinition).Error; err != nil {
		log.Err(err).Msg("Error finding silo definition")
		return nil, gqlerror.Errorf("Error finding silo definition.")
	}

	if err := r.Conf.DB.Select("Datapoint", "Subjects").Delete(siloDefinition).Error; err != nil {
		log.Err(err).Msg("Error deleting silo definition")
		return nil, gqlerror.Errorf("Error deleting silo definition.")
	}

	return &id, nil
}

// DeleteDatapoint is the resolver for the deleteDatapoint field.
func (r *mutationResolver) DeleteDatapoint(ctx context.Context, id string) (*string, error) {
	panic(fmt.Errorf("not implemented: DeleteSiloSpecification - deleteSiloSpecification"))
}

// DeleteSiloSpecification is the resolver for the deleteSiloSpecification field.
func (r *mutationResolver) DeleteSiloSpecification(ctx context.Context, id string) (*string, error) {
	panic(fmt.Errorf("not implemented: DeleteSiloSpecification - deleteSiloSpecification"))
}

// SiloDefinition is the resolver for the siloDefinition field.
func (r *queryResolver) SiloDefinition(ctx context.Context, id string) (*model.SiloDefinition, error) {
	silo := &model.SiloDefinition{}
	if err := r.Conf.DB.Where("id = ?", id).First(silo).Error; err != nil {
		log.Err(err).Msg("Error finding datapoint")
		return nil, gqlerror.Errorf("Error finding datapoint.")
	}

	return silo, nil
}

// Datapoint is the resolver for the datapoint field.
func (r *queryResolver) Datapoint(ctx context.Context, id string) (*model.Datapoint, error) {
	datapoint := &model.Datapoint{}
	if err := r.Conf.DB.Where("id = ?", id).First(datapoint).Error; err != nil {
		log.Err(err).Msg("Error finding datapoint")
		return nil, gqlerror.Errorf("Error finding datapoint.")
	}

	return datapoint, nil
}

// SiloDefinitions is the resolver for the siloDefinitions field.
func (r *queryResolver) SiloDefinitions(ctx context.Context, wsID string) ([]*model.SiloDefinition, error) {
	silos := []*model.SiloDefinition{}
	if err := r.Conf.DB.Where("workspace_id = ?", wsID).Find(&silos).Error; err != nil {
		log.Err(err).Msg("Error finding silos.")
		return nil, gqlerror.Errorf("Error finding silos.")
	}

	return silos, nil
}

// Datapoints is the resolver for the datapoints field.
func (r *queryResolver) Datapoints(ctx context.Context, wsID string) ([]*model.Datapoint, error) {
	datapoints := []*model.Datapoint{}
	if err := r.Conf.DB.Where("workspace_id = ?", wsID).Find(&datapoints).Error; err != nil {
		log.Err(err).Msg("Error finding datapoints")
		return nil, gqlerror.Errorf("Error finding datapoints.")
	}

	return datapoints, nil
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *queryResolver) SiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	siloSpecification := &model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", id).First(siloSpecification).Error; err != nil {
		log.Err(err).Msg("Error finding silo specification")
		return nil, gqlerror.Errorf("Error finding silo specification.")
	}

	return siloSpecification, nil
}

// SiloSpecifications is the resolver for the siloSpecifications field.
func (r *queryResolver) SiloSpecifications(ctx context.Context, wsID string) ([]*model.SiloSpecification, error) {
	siloSpecifications := []*model.SiloSpecification{}
	if err := r.Conf.DB.Where("workspace_id = ? OR workspace_id IS NULL", wsID).Find(&siloSpecifications).Error; err != nil {
		log.Err(err).Msg("Error finding silo specifications")
		return nil, gqlerror.Errorf("Error finding silo specifications.")
	}

	return siloSpecifications, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
