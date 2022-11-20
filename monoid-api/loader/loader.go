package loader

import (
	"context"
	"net/http"

	"github.com/brist-ai/monoid/config"
	"github.com/graph-gophers/dataloader"
)

type ctxKey string

const (
	loadersKey = ctxKey("dataloaders")
)

// Loaders wrap your data loaders to inject via middleware
type Loaders struct {
	PropertyCategoriesLoader *dataloader.Loader
	SiloDefinitionLoader     *dataloader.Loader
}

// NewLoaders instantiates data loaders for the middleware
func NewLoaders(conf *config.BaseConfig) *Loaders {
	// define the data loader
	propertyCategoryReader := &PropertyCategoryReader{conf: conf}
	siloDefinitionReader := &SiloDefinitionReader{conf: conf}

	loaders := &Loaders{
		PropertyCategoriesLoader: dataloader.NewBatchedLoader(propertyCategoryReader.GetPropertyCategories),
		SiloDefinitionLoader:     dataloader.NewBatchedLoader(siloDefinitionReader.GetSiloDefinition),
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
