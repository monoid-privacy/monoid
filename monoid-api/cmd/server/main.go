package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gorilla/mux"
	"github.com/monoid-privacy/monoid/cmd"
	"github.com/monoid-privacy/monoid/dataloader"
	"github.com/monoid-privacy/monoid/download"
	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/resolver"
	"go.temporal.io/sdk/client"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	conf := cmd.GetBaseConfig(true, cmd.Models)
	defer conf.AnalyticsIngestor.Close()

	c, err := client.Dial(client.Options{
		HostPort: os.Getenv("TEMPORAL"),
	})

	if err != nil {
		log.Fatalln("unable to create Temporal client", err)
	}
	defer c.Close()

	conf.TemporalClient = c
	conf.ResourcePath = os.Getenv("RESOURCE_PATH")

	router := mux.NewRouter()

	router.Use(func(h http.Handler) http.Handler {
		return conf.PreFlightHandler(dataloader.Middleware(&conf, h))
	})

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(
		generated.Config{
			Resolvers: &resolver.Resolver{
				Conf: &conf,
			},
		},
	))

	dh := download.DownloadHandler{
		Conf: &conf,
	}

	router.Handle("/", playground.Handler("GraphQL playground", "/query"))
	router.HandleFunc("/downloads/{id}", dh.HandleDownload)
	router.Handle("/query", srv)

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
