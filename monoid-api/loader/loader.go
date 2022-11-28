package loader

import (
	"context"
	"net/http"

	"github.com/graph-gophers/dataloader"
	"github.com/monoid-privacy/monoid/config"
)

type ctxKey string

const (
	loadersKey = ctxKey("dataloaders")
)

// Reader is the base class for any data loader readers
type Reader struct {
	conf *config.BaseConfig
}

// Loaders wrap your data loaders to inject via middleware
type Loaders struct {
	PropertyCategoriesLoader   *dataloader.Loader
	SiloDefinitionLoader       *dataloader.Loader
	DataSourcePropertiesLoader *dataloader.Loader
	DataSourceLoader           *dataloader.Loader
	QueryResultLoader          *dataloader.Loader
	SiloSpecificationLoader    *dataloader.Loader
	JobLoader                  *dataloader.Loader
}

// NewLoaders instantiates data loaders for the middleware
func NewLoaders(conf *config.BaseConfig) *Loaders {
	// define the data loader
	reader := &Reader{conf: conf}

	loaders := &Loaders{
		PropertyCategoriesLoader:   dataloader.NewBatchedLoader(reader.propertiesCategories),
		SiloDefinitionLoader:       dataloader.NewBatchedLoader(reader.siloDefinitions),
		DataSourcePropertiesLoader: dataloader.NewBatchedLoader(reader.dataSourcesProperties),
		DataSourceLoader:           dataloader.NewBatchedLoader(reader.dataSources),
		QueryResultLoader:          dataloader.NewBatchedLoader(reader.queryResults),
		SiloSpecificationLoader:    dataloader.NewBatchedLoader(reader.siloSpecifications),
		JobLoader:                  dataloader.NewBatchedLoader(reader.jobs),
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
