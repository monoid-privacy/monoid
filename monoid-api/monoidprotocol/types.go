package monoidprotocol

import "context"

type MonoidProtocol interface {
	InitConn(ctx context.Context) error
	Spec(ctx context.Context) (*MonoidSiloSpec, error)
	Validate(ctx context.Context, config map[string]interface{}) (*MonoidValidateMessage, error)
	Teardown(ctx context.Context) error
}
