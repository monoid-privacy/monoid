package loader

import (
	"context"
	"net/http"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/graph-gophers/dataloader"
	"github.com/rs/zerolog/log"
)

type ctxKey string

const (
	loadersKey = ctxKey("dataloaders")
)

// CategoryReader reads categories from a database
type PropertyCategoryReader struct {
	conf *config.BaseConfig
}

// GetUsers implements a batch function that can retrieve many users by ID,
// for use in a dataloader
func (c *PropertyCategoryReader) GetCategories(ctx context.Context, keys dataloader.Keys) []*dataloader.Result {
	// read all requested users in a single query
	propertyIDs := make([]string, len(keys))
	for ix, key := range keys {
		propertyIDs[ix] = key.String()
	}

	log.Info().Msgf("Property IDs %v", propertyIDs)

	type propertyCategory struct {
		PropertyID string
		CategoryID string
		Category   *model.Category
	}

	pcs := []propertyCategory{}

	if err := c.conf.DB.Debug().Where(
		"property_id IN ?",
		propertyIDs,
	).Preload("Category").Find(&pcs).Error; err != nil {
		log.Err(err).Msg("Error finding categories")
	}

	categoryMap := map[string][]*model.Category{}
	for _, c := range pcs {
		if categoryMap[c.PropertyID] == nil {
			categoryMap[c.PropertyID] = []*model.Category{}
		}

		categoryMap[c.PropertyID] = append(categoryMap[c.PropertyID], c.Category)
	}

	// return users in the same order requested
	output := make([]*dataloader.Result, len(keys))
	for index, catKey := range keys {
		cats, ok := categoryMap[catKey.String()]
		if ok {
			output[index] = &dataloader.Result{Data: cats, Error: nil}
		} else {
			output[index] = &dataloader.Result{Data: []*model.Category{}, Error: nil}
		}
	}

	return output
}

// Loaders wrap your data loaders to inject via middleware
type Loaders struct {
	CategoryLoader *dataloader.Loader
}

// NewLoaders instantiates data loaders for the middleware
func NewLoaders(conf *config.BaseConfig) *Loaders {
	// define the data loader
	userReader := &PropertyCategoryReader{conf: conf}
	loaders := &Loaders{
		CategoryLoader: dataloader.NewBatchedLoader(userReader.GetCategories),
	}
	return loaders
}

// Middleware injects data loaders into the context
func Middleware(conf *config.BaseConfig, next http.Handler) http.Handler {
	loaders := NewLoaders(conf)

	// return a middleware that injects the loader to the request context
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCtx := context.WithValue(r.Context(), loadersKey, loaders)
		r = r.WithContext(nextCtx)
		next.ServeHTTP(w, r)
	})
}

// For returns the dataloader for a given context
func For(ctx context.Context) *Loaders {
	return ctx.Value(loadersKey).(*Loaders)
}

// GetUser wraps the User dataloader for efficient retrieval by user ID
func GetCategories(ctx context.Context, propertyID string) ([]*model.Category, error) {
	loaders := For(ctx)
	thunk := loaders.CategoryLoader.Load(ctx, dataloader.StringKey(propertyID))
	result, err := thunk()
	if err != nil {
		return nil, err
	}
	return result.([]*model.Category), nil
}
