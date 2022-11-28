package loader

import (
	"context"
	"fmt"

	"github.com/graph-gophers/dataloader"
	"github.com/monoid-privacy/monoid/model"
	"github.com/rs/zerolog/log"
)

// SiloDefinition wraps the associated dataloader
func SiloDefinition(ctx context.Context, id string) (*model.SiloDefinition, error) {
	loaders := For(ctx)
	thunk := loaders.SiloDefinitionLoader.Load(ctx, dataloader.StringKey(id))
	result, err := thunk()
	if err != nil {
		return nil, err
	}
	return result.(*model.SiloDefinition), nil
}

// siloDefinitions gets all the silo definnitions by ids in keys
func (c *Reader) siloDefinitions(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	// read all requested users in a single query
	ids := make([]string, len(keys))
	for ix, key := range keys {
		ids[ix] = key.String()
	}

	silos := []*model.SiloDefinition{}

	if err := c.conf.DB.Where(
		"id IN ?",
		ids,
	).Find(&silos).Error; err != nil {
		log.Err(err).Msg("Error finding silos.")
	}

	siloMap := map[string]*model.SiloDefinition{}
	for _, c := range silos {
		siloMap[c.ID] = c
	}

	// return users in the same order requested
	output := make([]*dataloader.Result, len(keys))
	for index, k := range keys {
		res, ok := siloMap[k.String()]
		if ok {
			output[index] = &dataloader.Result{Data: res, Error: nil}
		} else {
			output[index] = &dataloader.Result{Data: nil, Error: fmt.Errorf("could not find silo")}
		}
	}

	return output
}
