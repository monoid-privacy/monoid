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
	ws, err := r.Conf.Persistence.Workspaces(ctx)

	if err != nil {
		log.Err(err).Msg("Error finding workspaces")
		return nil, gqlerror.Errorf("Error finding workspaces.")
	}

	return ws, nil
}

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
