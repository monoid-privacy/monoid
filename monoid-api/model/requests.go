package model

const (
	Created  = "created"
	Executed = "executed"
	Failed   = "failed"
	Delete   = "delete"
	Query    = "query"
)

type RequestStatus struct {
	ID           string
	RequestID    string
	Request      Request `gorm:"constraint:OnDelete:CASCADE;"`
	DataSourceID string
	DataSource   DataSource `gorm:"constraint:OnDelete:CASCADE;"`
	Status       string
}

type Request struct {
	ID               string
	PrimaryKeyValues []PrimaryKeyValue
	WorkspaceID      string
	Workspace        Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	RequestStatuses  []RequestStatus
	Type             string
}

type PrimaryKeyValue struct {
	ID               string
	UserPrimaryKeyID string
	UserPrimaryKey   UserPrimaryKey
	RequestID        string
	Request          Request `gorm:"constraint:OnDelete:CASCADE;"`
	Value            string
}
