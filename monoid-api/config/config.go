package config

import (
	"net/http"

	"github.com/monoid-privacy/monoid/analytics/ingestor"
	"github.com/monoid-privacy/monoid/filestore"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
)

type BaseConfig struct {
	DB                *gorm.DB
	WebURL            string
	ProtocolFactory   monoidprotocol.MonoidProtocolFactory
	FileStore         filestore.FileStore
	TempStorePath     string
	TemporalClient    client.Client
	AnalyticsIngestor ingestor.Ingestor
	EncryptionKey     []byte
	ResourcePath      string
}

func (c BaseConfig) PreFlightHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Access-Control-Allow-Origin", c.WebURL)
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, DELETE, PUT")
		w.Header().Set("Access-Control-Allow-Headers", "content-type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", c.WebURL)
		next.ServeHTTP(w, r)
	})
}
