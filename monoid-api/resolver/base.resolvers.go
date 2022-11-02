package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
)

// CreateWorkspace is the resolver for the createWorkspace field.
func (r *mutationResolver) CreateWorkspace(ctx context.Context) (*model.Workspace, error) {
	workspace := model.Workspace{
		ID: uuid.NewString(),
	}
	if err := r.Conf.DB.Create(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace, nil
}

// DeleteWorkspace is the resolver for the deleteWorkspace field.
func (r *mutationResolver) DeleteWorkspace(ctx context.Context, id *string) (*string, error) {
	workspace := &model.Workspace{}

	if err := r.Conf.DB.Where("id = ?", id).First(workspace).Error; err != nil {
		return nil, handleError(err, "Error finding workspace.")
	}

	if err := r.Conf.DB.Delete(workspace).Error; err != nil {
		return nil, handleError(err, "Error deleting workspace.")
	}

	// TODO: Cascade deletes
	panic(fmt.Errorf("not implemented: delete cascades in DeleteWorkspace"))

	return id, nil
}

// Workspaces is the resolver for the workspaces field.
func (r *queryResolver) Workspaces(ctx context.Context) ([]*model.Workspace, error) {
	return findAllObjects[model.Workspace](r.Conf.DB, "Error finding workspaces.")
}

// Workspace is the resolver for the workspace field.
func (r *queryResolver) Workspace(ctx context.Context, id string) (*model.Workspace, error) {
	return findObjectByID[model.Workspace](id, r.Conf.DB, "Error finding workspace.")
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
