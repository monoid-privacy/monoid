package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/resolver"
	"github.com/gorilla/mux"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	conf := cmd.GetBaseConfig(true, []interface{}{
		model.Workspace{},
		model.Category{},
		model.Connector{},
		model.Datapoint{},
		model.Purpose{},
		model.SiloDefinition{},
		model.SiloSpecification{},
		model.Subject{},
	})

	router := mux.NewRouter()

	router.Use(func(h http.Handler) http.Handler {
		return conf.PreFlightHandler(h)
	})

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(
		generated.Config{
			Resolvers: &resolver.Resolver{
				Conf: &conf,
			},
		},
	))

	// http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	router.Handle("/", playground.Handler("GraphQL playground", "/query"))
	router.Handle("/query", srv)

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
