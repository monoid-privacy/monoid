package loader

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
	"github.com/rs/zerolog/log"
)

// DataSourceProperties wraps the associated dataloader
func DataSourceProperties(ctx context.Context, dataSourceID string) ([]*model.Property, error) {
	loaders := For(ctx)
	thunk := loaders.DataSourcePropertiesLoader.Load(ctx, dataloader.StringKey(dataSourceID))
	result, err := thunk()
	if err != nil {
		return nil, err
	}
	return result.([]*model.Property), nil
}

// dataSourceProperties gets all the properties for a list of data sources
func (c *Reader) dataSourcesProperties(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	dataSourceIDs := make([]string, len(keys))
	for ix, key := range keys {
		dataSourceIDs[ix] = key.String()
	}

	properties := []*model.Property{}
	if err := c.conf.DB.Where(
		"data_source_id IN ?",
		dataSourceIDs,
	).Order("created_at desc, name asc").Find(&properties).Error; err != nil {
		log.Err(err).Msg("Error finding categories")
	}

	propertyMap := map[string][]*model.Property{}
	for _, p := range properties {
		if propertyMap[p.DataSourceID] == nil {
			propertyMap[p.DataSourceID] = []*model.Property{}
		}

		propertyMap[p.DataSourceID] = append(propertyMap[p.DataSourceID], p)
	}

	// Reassign output to an array of array results.
	output := make([]*dataloader.Result, len(keys))
	for index, k := range keys {
		props, ok := propertyMap[k.String()]
		if ok {
			output[index] = &dataloader.Result{Data: props, Error: nil}
		} else {
			output[index] = &dataloader.Result{Data: []*model.Property{}, Error: nil}
		}
	}

	return output
}
