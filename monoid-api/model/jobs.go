package model

import (
	"fmt"
	"time"
)

const (
	JobTypeDiscoverSources = "discover_sources"
	JobTypeExecuteRequest  = "execute_request"
)

type Job struct {
	ID                 string    `json:"id"`
	WorkspaceID        string    `json:"workspaceId"`
	Workspace          Workspace `json:"workspace"`
	JobType            string    `json:"jobType"`
	ResourceID         string    `json:"resourceId"`
	LogObject          string    `json:"logObject"`
	Status             JobStatus `json:"status"`
	TemporalWorkflowID string    `json:"temporalWorkflowId"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (j *Job) KeyField(field string) (string, error) {
	if field == "id" {
		return j.ID, nil
	}

	return "", fmt.Errorf("unknown field")
}
