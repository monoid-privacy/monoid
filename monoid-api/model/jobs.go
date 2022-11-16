package model

import "time"

const (
	JobTypeDiscoverSources = "discover_sources"
	JobTypeExecuteRequest  = "execute_request"
)

type Job struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	Workspace   Workspace `json:"workspace"`
	JobType     string    `json:"jobType"`
	ResourceID  string    `json:"resourceId"`
	Status      JobStatus `json:"status"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
