package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// CreateWorkspace is the resolver for the createWorkspace field.
func (r *mutationResolver) CreateWorkspace(ctx context.Context) (*string, error) {
	workspace := model.Workspace{
		ID: uuid.NewString(),
	}
	if err := r.Conf.DB.Create(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace.ID, nil
}

// DeleteWorkspace is the resolver for the deleteWorkspace field.
func (r *mutationResolver) DeleteWorkspace(ctx context.Context, id *string) (*string, error) {
	workspace := &model.Workspace{}

	if err := r.Conf.DB.Where("id = ?", id).First(workspace).Error; err != nil {
		log.Err(err).Msg("Error finding workspace")
		return nil, gqlerror.Errorf("Error finding workspace.")
	}

	if err := r.Conf.DB.Delete(workspace).Error; err != nil {
		log.Err(err).Msg("Error deleting workspace")
		return nil, gqlerror.Errorf("Error deleting workspace.")
	}

	// TODO: Cascade deletes
	panic(fmt.Errorf("not implemented: delete cascades in DeleteWorkspace"))

	return id, nil
}

// Workspaces is the resolver for the workspaces field.
func (r *queryResolver) Workspaces(ctx context.Context) ([]*model.Workspace, error) {
	workspaces := []*model.Workspace{}
	if err := r.Conf.DB.Find(&workspaces).Error; err != nil {
		log.Err(err).Msg("Error finding workspaces")
		return nil, gqlerror.Errorf("Error finding workspaces.")
	}

	return workspaces, nil
}

// Workspace is the resolver for the workspace field.
func (r *queryResolver) Workspace(ctx context.Context, id string) (*model.Workspace, error) {
	workspace := model.Workspace{}
	if err := r.Conf.DB.Where("id = ?", id).First(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
