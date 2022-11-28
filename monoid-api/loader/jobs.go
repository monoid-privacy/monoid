package loader

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
)

// Job wraps the associated dataloader
func Job(ctx context.Context, id string) (*model.Job, error) {
	loaders := For(ctx)
	return getData[*model.Job](ctx, id, loaders.JobLoader)
}

// jobs gets all the jobs in keys by ID
func (c *Reader) jobs(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	return loadData[*model.Job](ctx, c.conf.DB, false, keys)
}
