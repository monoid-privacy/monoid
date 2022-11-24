package loader

import (
	"context"
	"fmt"

	"github.com/graph-gophers/dataloader"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type loaderable interface {
	KeyField(field string) (string, error)
}

func getData[T loaderable](ctx context.Context, id string, loader *dataloader.Loader) (res T, err error) {
	thunk := loader.Load(ctx, dataloader.StringKey(id))
	result, err := thunk()
	if err != nil {
		return
	}

	if result == nil {
		return
	}

	return result.(T), nil
}

// loadData is a helper that collects keys from a dataloader and
// runs the query
func loadData[T loaderable](ctx context.Context, db *gorm.DB, emptyError bool, keys dataloader.Keys) []*dataloader.Result {
	return loadDataField[T](ctx, db, "id", emptyError, keys)
}

// loadDataField is a helper that collects keys from a dataloader and
// runs the query
func loadDataField[T loaderable](
	ctx context.Context,
	db *gorm.DB,
	field string,
	emptyError bool,
	keys dataloader.Keys,
) []*dataloader.Result {
	// read all requested users in a single query
	ids := make([]string, len(keys))
	for ix, key := range keys {
		ids[ix] = key.String()
	}

	resArr := []T{}

	if err := db.Where(
		fmt.Sprintf("%s IN ?", field),
		ids,
	).Find(&resArr).Error; err != nil {
		log.Err(err).Msg("Error finding data.")
	}

	resMap := map[string]T{}
	for _, c := range resArr {
		resKey, err := c.KeyField(field)
		if err != nil {
			log.Err(err).Msg("Error with dataloader")
			continue
		}

		resMap[resKey] = c
	}

	// return users in the same order requested
	output := make([]*dataloader.Result, len(keys))
	for index, k := range keys {
		res, ok := resMap[k.String()]
		if ok {
			output[index] = &dataloader.Result{Data: res, Error: nil}
		} else {
			if emptyError {
				output[index] = &dataloader.Result{Data: nil, Error: nil}
			} else {
				output[index] = &dataloader.Result{Data: nil, Error: fmt.Errorf("could not find data")}
			}
		}
	}

	return output
}
