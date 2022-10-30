package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
)

// Silo is the resolver for the silo field.
func (r *datapointResolver) Silo(ctx context.Context, obj *model.Datapoint) (*model.SiloDefinition, error) {
	panic(fmt.Errorf("not implemented: Silo - silo"))
}

// Silo is the resolver for the silo field.
func (r *queryResolver) Silo(ctx context.Context, id string) (*model.SiloDefinition, error) {
	panic(fmt.Errorf("not implemented: Silo - silo"))
}

// Datapoint is the resolver for the datapoint field.
func (r *queryResolver) Datapoint(ctx context.Context, id string) (*model.Datapoint, error) {
	panic(fmt.Errorf("not implemented: Datapoint - datapoint"))
}

// Silos is the resolver for the silos field.
func (r *queryResolver) Silos(ctx context.Context, wsID string) ([]*model.SiloDefinition, error) {
	panic(fmt.Errorf("not implemented: Silos - silos"))
}

// Datapoints is the resolver for the datapoints field.
func (r *queryResolver) Datapoints(ctx context.Context, wsID string) ([]*model.Datapoint, error) {
	panic(fmt.Errorf("not implemented: Datapoints - datapoints"))
}

// Datapoint returns generated.DatapointResolver implementation.
func (r *Resolver) Datapoint() generated.DatapointResolver { return &datapointResolver{r} }

type datapointResolver struct{ *Resolver }
