package monoidprotocol

//go:generate mockgen -source=./types.go -destination=../mocks/mock_protocols.go -package=mocks MonoidProtocolFactory,MonoidProtocol
//go:generate gojsonschema -p github.com/monoid/monoidprotocol --schema-output=monoid_protocol.json=./protocol.go ../../monoid-py/monoid_protocol.json
import (
	"context"
)

type MonoidProtocolFactory interface {
	NewMonoidProtocol(
		image string,
		tag string,
		persistDir string,
	) (MonoidProtocol, error)
}

type MonoidProtocol interface {
	InitConn(ctx context.Context) error

	Spec(ctx context.Context) (*MonoidSiloSpec, error)

	Validate(ctx context.Context, config map[string]interface{}) (*MonoidValidateMessage, error)

	Query(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRequestResult, chan int64, error)

	Scan(
		ctx context.Context,
		config map[string]interface{},
		schemas MonoidSchemasMessage,
	) (chan MonoidRecord, chan int64, error)

	Delete(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRequestResult, chan int64, error)

	RequestResults(
		ctx context.Context,
		config map[string]interface{},
		requests MonoidRequestsMessage,
	) (chan MonoidRecord, chan int64, error)

	RequestStatus(
		ctx context.Context,
		config map[string]interface{},
		requests MonoidRequestsMessage,
	) (chan MonoidRequestStatus, chan int64, error)

	Schema(
		ctx context.Context,
		config map[string]interface{},
	) (*MonoidSchemasMessage, error)

	AttachLogs(ctx context.Context) (chan MonoidLogMessage, error)

	Teardown(ctx context.Context) error
}
