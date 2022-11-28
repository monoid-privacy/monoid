package loader

import (
	"context"

	"github.com/graph-gophers/dataloader"
	"github.com/monoid-privacy/monoid/model"
)

// SiloSpecification wraps the associated dataloader
func SiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	loaders := For(ctx)
	return getData[*model.SiloSpecification](ctx, id, loaders.SiloSpecificationLoader)
}

// siloSpecifications gets a list of silo specifications by id
func (c *Reader) siloSpecifications(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadData[*model.SiloSpecification](ctx, c.conf.DB, false, keys)
}
