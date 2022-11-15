package analytics

import (
	"encoding/json"
	"net/http"

	"github.com/brist-ai/monoid/analytics/ingestor"
)

type AnalyticsHandler struct {
	Ingestor ingestor.Ingestor
}

type TrackPayload struct {
	UserID     string                 `json:"userId"`
	Event      string                 `json:"event"`
	Properties map[string]interface{} `json:"properties"`
}

func (h *AnalyticsHandler) HandleTrack(w http.ResponseWriter, r *http.Request) {
	payload := TrackPayload{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	h.Ingestor.Track(payload.Event, &payload.UserID, payload.Properties)
	w.WriteHeader(http.StatusOK)
}

type IdentifyPayload struct {
	UserID string                 `json:"userId"`
	Traits map[string]interface{} `json:"traits"`
}

func (h *AnalyticsHandler) HandleIdentify(w http.ResponseWriter, r *http.Request) {
	payload := IdentifyPayload{}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	h.Ingestor.Identify(&payload.UserID, payload.Traits)
	w.WriteHeader(http.StatusOK)
}
