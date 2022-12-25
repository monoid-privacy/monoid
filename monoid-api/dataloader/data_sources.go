package dataloader

import (
	"context"

	"github.com/graph-gophers/dataloader"
	"github.com/monoid-privacy/monoid/model"
)

// DataSource wraps the associated dataloader
func DataSource(ctx context.Context, id string) (*model.DataSource, error) {
	loaders := For(ctx)
	return getData[*model.DataSource](ctx, id, loaders.DataSourceLoader)
}

func DataSourceUnscoped(ctx context.Context, id string) (*model.DataSource, error) {
	loaders := For(ctx)
	return getData[*model.DataSource](ctx, id, loaders.DataSourceLoader)
}

// dataSources gets all the datasources in keys.
func (c *Reader) dataSources(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	unscoped, ok := ctx.Value(UnscopedKey).(bool)
	if ok && unscoped {
		return loadDataUnscoped[*model.DataSource](ctx, c.conf.DB, false, keys)
	}

	return loadData[*model.DataSource](ctx, c.conf.DB, false, keys)
}
