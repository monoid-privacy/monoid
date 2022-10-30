package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/rs/zerolog/log"
	"github.com/twinj/uuid"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

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

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }

// !!! WARNING !!!
// The code below was going to be deleted when updating resolvers. It has been copied here so you have
// one last chance to move it out of harms way if you want. There are two reasons this happens:
//  - When renaming or deleting a resolver the old code will be put in here. You can safely delete
//    it when you're done.
//  - You have helper methods in this file. Move them out to keep these resolver files clean.
func (r *queryResolver) CreateWorkspace(ctx context.Context, workspace *model.Workspace) error {
	workspace.ID = uuid.NewV1().String()
	if err := r.Conf.DB.Create(&workspace).Error; err != nil {
		return err
	}

	return nil
}
