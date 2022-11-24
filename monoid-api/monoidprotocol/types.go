package monoidprotocol

import (
	"context"
)

type MonoidProtocol interface {
	InitConn(ctx context.Context) error

	Spec(ctx context.Context) (*MonoidSiloSpec, error)

	Validate(ctx context.Context, config map[string]interface{}) (*MonoidValidateMessage, error)

	Query(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRequestResult, error)

	Scan(
		ctx context.Context,
		config map[string]interface{},
		schemas MonoidSchemasMessage,
	) (chan MonoidRecord, error)

	Delete(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRequestResult, error)

	RequestResults(
		ctx context.Context,
		config map[string]interface{},
		requests MonoidRequestsMessage,
	) (chan MonoidRecord, error)

	RequestStatus(
		ctx context.Context,
		config map[string]interface{},
		requests MonoidRequestsMessage,
	) (chan MonoidRequestStatus, error)

	Schema(
		ctx context.Context,
		config map[string]interface{},
	) (*MonoidSchemasMessage, error)

	AttachLogs(ctx context.Context) (chan MonoidLogMessage, error)

	Teardown(ctx context.Context) error
}
