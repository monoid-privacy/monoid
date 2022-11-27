package loader

import (
	"context"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
)

// GetSiloSpecification wraps the associated dataloader
func GetSiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	loaders := For(ctx)
	return getData[*model.SiloSpecification](ctx, id, loaders.SiloSpecificationLoader)
}

// CategoryReader reads categories from a database
type SiloSpecificationReader struct {
	conf *config.BaseConfig
}

// GetCategories gets all the categories for a number of properties
func (c *SiloSpecificationReader) GetSiloSpecification(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadData[*model.SiloSpecification](ctx, c.conf.DB, false, keys)
}
