package model

import "time"

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
}

type UserPrimaryKey struct {
	ID          string `json:"id"`
	WorkspaceID string `json:"workspaceId" gorm:"uniqueIndex:idx_api_identifier"`

	Name          string      `json:"name"`
	APIIdentifier string      `json:"apiIdentifier" gorm:"uniqueIndex:idx_api_identifier"`
	Properties    []*Property `json:"properties"`
}

type Request struct {
	ID               string
	PrimaryKeyValues []PrimaryKeyValue
	WorkspaceID      string
	Workspace        Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	RequestStatuses  []RequestStatus
	Type             UserDataRequestType

	CreatedAt time.Time
	UpdatedAt time.Time
}

type PrimaryKeyValue struct {
	ID               string
	UserPrimaryKeyID string
	UserPrimaryKey   UserPrimaryKey
	RequestID        string
	Request          Request `gorm:"constraint:OnDelete:CASCADE;"`
	Value            string
}

type QueryResult struct {
	ID              string
	RequestStatusID string
	RequestStatus   RequestStatus
	ResultType      ResultType
	Records         *SecretString
}
