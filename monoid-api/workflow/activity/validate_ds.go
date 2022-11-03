package activity

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/docker/docker/client"
)

func (a *Activity) ValidateDataSiloDef(ctx context.Context, dataSourceDef model.SiloDefinition) error {
	_, err := client.NewClientWithOpts(client.FromEnv)

	if err != nil {
		return err
	}

	return nil
}
