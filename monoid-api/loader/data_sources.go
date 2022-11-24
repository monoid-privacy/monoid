package loader

import (
	"context"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
)

// GetPropertyCategories wraps the associated dataloader
func GetDataSource(ctx context.Context, id string) (*model.DataSource, error) {
	loaders := For(ctx)
	return getData[*model.DataSource](ctx, id, loaders.DataSourceLoader)
}

// CategoryReader reads categories from a database
type DataSourcesReader struct {
	conf *config.BaseConfig
}

// GetCategories gets all the categories for a number of properties
func (c *DataSourcesReader) GetDataSources(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadData[*model.DataSource](ctx, c.conf.DB, false, keys)
}
