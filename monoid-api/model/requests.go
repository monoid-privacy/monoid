package model

import (
	"fmt"
	"time"
)

type ResultType string

const (
	ResultTypeRecordsJSON = ResultType("RECORDS_JSON")
	ResultTypeFile        = ResultType("FILE")
)

type RequestStatus struct {
	ID            string
	RequestID     string
	Request       Request `gorm:"constraint:OnDelete:CASCADE;"`
	DataSourceID  string
	DataSource    DataSource `gorm:"constraint:OnDelete:CASCADE;"`
	Status        RequestStatusType
	RequestHandle SecretString

	QueryResult *QueryResult
}

type UserPrimaryKey struct {
	ID          string `json:"id"`
	WorkspaceID string `json:"workspaceId" gorm:"uniqueIndex:idx_api_identifier"`

	Name          string      `json:"name"`
	APIIdentifier string      `json:"apiIdentifier" gorm:"uniqueIndex:idx_api_identifier"`
	Properties    []*Property `json:"properties"`
}

type DownloadableFile struct {
	ID          string
	StoragePath string
}

type Request struct {
	ID               string
	PrimaryKeyValues []PrimaryKeyValue
	WorkspaceID      string
	Workspace        Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	RequestStatuses  []RequestStatus
	Type             UserDataRequestType

	DownloadableFileID *string
	DownloadableFile   *DownloadableFile

	JobID *string
	Job   *Job

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (r *Request) Status() (FullRequestStatus, error) {
	switch r.Job.Status {
	case JobStatusCompleted:
		return FullRequestStatusExecuted, nil
	case JobStatusFailed:
		return FullRequestStatusFailed, nil
	case JobStatusPartialFailed:
		return FullRequestStatusPartialFailed, nil
	case JobStatusQueued, JobStatusRunning:
		return FullRequestStatusInProgress, nil
	}

	return FullRequestStatusCreated, fmt.Errorf("error finding status")
}

type PrimaryKeyValue struct {
	ID               string
	UserPrimaryKeyID string
	UserPrimaryKey   UserPrimaryKey
	RequestID        string
	Request          Request `gorm:"constraint:OnDelete:CASCADE;"`
	Value            string
}

type QueryResultFileData struct {
	FilePath string `json:"filePath"`
}

type QueryResult struct {
	ID         string
	ResultType ResultType
	Records    *SecretString

	RequestStatusID string
	RequestStatus   RequestStatus

	DownloadableFileID *string
	DownloadableFile   *DownloadableFile
}

func (q *QueryResult) KeyField(field string) (string, error) {
	if field == "id" {
		return q.ID, nil
	} else if field == "request_status_id" {
		return q.RequestStatusID, nil
	}

	return "", fmt.Errorf("unknown field")
}
