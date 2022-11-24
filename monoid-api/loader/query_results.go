package loader

import (
	"context"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
)

// GetQueryResult wraps the associated dataloader
func GetQueryResult(ctx context.Context, id string) (*model.QueryResult, error) {
	loaders := For(ctx)
	return getData[*model.QueryResult](ctx, id, loaders.QueryResultLoader)
}

// QueryResultReader reads query results from a database
type QueryResultReader struct {
	conf *config.BaseConfig
}

// GetQueryResult gets a query result by id
func (c *QueryResultReader) GetQueryResult(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadDataField[*model.QueryResult](
		ctx,
		c.conf.DB,
		"request_status_id",
		true,
		keys,
	)
}
