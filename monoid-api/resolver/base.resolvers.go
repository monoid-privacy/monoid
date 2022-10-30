package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/rs/zerolog/log"
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
