package main

import (
	"net/http"
	"os"

	"github.com/brist-ai/monoid/analytics"
	"github.com/brist-ai/monoid/analytics/ingestor"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
)

const defaultPort = "8081"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	router := mux.NewRouter()

	analyticsHandler := analytics.AnalyticsHandler{
		Ingestor: ingestor.NewSegmentIngestor(os.Getenv("SEGMENT_WRITE_KEY"), nil),
	}

	defer analyticsHandler.Ingestor.Close()

	router.HandleFunc("/track", analyticsHandler.HandleTrack)
	router.HandleFunc("/identify", analyticsHandler.HandleIdentify)

	log.Info().Msgf("starting analytics service on %s", port)
	http.ListenAndServe(":"+port, router)
}
