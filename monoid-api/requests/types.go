package requests

import (
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
)

const (
	Delete = "delete"
	Query  = "query"
)

type RequestHandler interface {
	HandleDeletion(request DeletionRequest) ([]monoidprotocol.MonoidRecord, error)
}

type MonoidRequestHandler struct {
	SuccessfulSources   []model.DataSource
	UnsuccessfulSources []model.DataSource
	Records             []monoidprotocol.MonoidRecord
}

// Map from primary key ID to the value for the user
type PrimaryKeyMap map[string]string

type DeletionRequest struct {
	PrimaryKeyMap   PrimaryKeyMap
	SiloDefinitions []model.SiloDefinition
}

type QueryRequest struct {
	PrimaryKeyMap   PrimaryKeyMap
	SiloDefinitions []model.SiloDefinition
}
