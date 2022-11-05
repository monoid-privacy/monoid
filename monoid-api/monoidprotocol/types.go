package monoidprotocol

import "context"

type MonoidProtocol interface {
	InitConn(ctx context.Context) error

	Spec(ctx context.Context) (*MonoidSiloSpec, error)

	Validate(ctx context.Context, config map[string]interface{}) (*MonoidValidateMessage, error)

	Query(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRecord, error)

	Sample(
		ctx context.Context,
		config map[string]interface{},
		schemas MonoidSchemasMessage,
	) (chan MonoidRecord, error)

	Delete(
		ctx context.Context,
		config map[string]interface{},
		query MonoidQuery,
	) (chan MonoidRecord, error)

	Schema(
		ctx context.Context,
		config map[string]interface{},
	) (*MonoidSchemasMessage, error)

	Teardown(ctx context.Context) error
	Schema(ctx context.Context, config map[string]interface{}) (*MonoidSchemasMessage, error)
}
