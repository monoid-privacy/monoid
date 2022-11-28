package activity

import (
	"context"
	"encoding/json"

	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	"go.temporal.io/sdk/activity"
)

type ValidateDSArgs struct {
	SiloSpecID string
	Config     []byte
}

func (a *Activity) ValidateDataSiloDef(ctx context.Context, args ValidateDSArgs) (*monoidprotocol.MonoidValidateMessage, error) {
	logger := activity.GetLogger(ctx)

	logger.Info("Validating silo def")

	spec := model.SiloSpecification{}
	if err := a.Conf.DB.Where("id = ?", args.SiloSpecID).First(&spec).Error; err != nil {
		logger.Error("Could not find silo spec: %v", err)
		return nil, err
	}

	mp, err := a.Conf.ProtocolFactory.NewMonoidProtocol(spec.DockerImage, spec.DockerTag, "")
	if err != nil {
		logger.Error("Error creating docker client: %v", err)
		return nil, err
	}

	defer mp.Teardown(ctx)

	logChan, err := mp.AttachLogs(ctx)
	if err != nil {
		logger.Error("Error attaching logs: %v", err)
		return nil, err
	}

	go func() {
		for logMsg := range logChan {
			logger.Info("Msg", logMsg.Message)
		}
	}()

	if err := mp.InitConn(ctx); err != nil {
		logger.Error("Error creating docker connection: %v", err)
		return nil, err
	}

	confString := model.SecretString("")
	confString.Scan(args.Config)

	conf := map[string]interface{}{}
	json.Unmarshal([]byte(confString), &conf)

	logger.Info("validating")

	validate, err := mp.Validate(ctx, conf)

	if err != nil {
		logger.Error("Error running validate: %v", err)
		return nil, err
	}

	return validate, nil
}
