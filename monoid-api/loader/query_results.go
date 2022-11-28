package loader

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
)

// QueryResult wraps the associated dataloader
func QueryResult(ctx context.Context, id string) (*model.QueryResult, error) {
	loaders := For(ctx)
	return getData[*model.QueryResult](ctx, id, loaders.QueryResultLoader)
}

// queryResults gets a list of query results by id
func (c *Reader) queryResults(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadDataField[*model.QueryResult](
		ctx,
		c.conf.DB,
		"request_status_id",
		true,
		keys,
	)
}
