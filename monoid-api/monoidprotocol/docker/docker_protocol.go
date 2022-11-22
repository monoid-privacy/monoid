package docker

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
)

type DockerMonoidProtocol struct {
	client      *client.Client
	imageName   string
	containerID *string
	volume      *string
	logChan     chan monoidprotocol.MonoidLogMessage
	closeClient bool
}

func NewDockerMPWithClient(dockerImage string, dockerTag string, cli *client.Client, closeClient bool) monoidprotocol.MonoidProtocol {
	imageName := dockerImage + ":" + dockerTag

	return &DockerMonoidProtocol{
		client:      cli,
		imageName:   imageName,
		volume:      nil,
		logChan:     nil,
		closeClient: closeClient,
	}
}

// NewDockerMP creates an docker-based interface for the monoid protocol.
func NewDockerMP(dockerImage string, dockerTag string) (monoidprotocol.MonoidProtocol, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)

	if err != nil {
		return nil, err
	}

	return NewDockerMPWithClient(dockerImage, dockerTag, cli, true), nil
}

func (dp *DockerMonoidProtocol) InitConn(ctx context.Context) error {
	// logger := activity.GetLogger(ctx)

	// logger.Info("Inspecting", map[string]interface{}{"img": dp.imageName})
	_, _, err := dp.client.ImageInspectWithRaw(ctx, dp.imageName)
	// logger.Info("Inspected", map[string]interface{}{"error": err})

	if err != nil {
		_, err := dp.client.ImagePull(ctx, dp.imageName, types.ImagePullOptions{})

		if err != nil {
			return err
		}
	}

	return nil
}

func (dp *DockerMonoidProtocol) Spec(ctx context.Context) (*monoidprotocol.MonoidSiloSpec, error) {
	msg, err := dp.runCmdStaticLog(
		ctx,
		"spec",
		map[string]interface{}{},
	)

	if err != nil {
		return nil, err
	}

	if msg.Type != monoidprotocol.MonoidMessageTypeSPEC || msg.Spec == nil {
		return nil, fmt.Errorf("incorrect message type: %v", msg.Type)
	}

	return msg.Spec, nil
}

func (dp *DockerMonoidProtocol) Validate(
	ctx context.Context,
	config map[string]interface{},
) (*monoidprotocol.MonoidValidateMessage, error) {
	msgChan, err := dp.runCmdLiveLogs(
		ctx,
		"validate",
		map[string]interface{}{
			"-c": config,
		},
	)

	if err != nil {
		return nil, err
	}

	msgChan = collectLogs(msgChan, dp.logChan)
	var res *monoidprotocol.MonoidValidateMessage

	for s := range msgChan {
		if s.Type != monoidprotocol.MonoidMessageTypeVALIDATE || s.ValidateMsg == nil {
			log.Debug().Msgf("Message type is not validate: %s", string(s.Type))
			continue
		}

		res = s.ValidateMsg
	}

	if res == nil {
		return nil, fmt.Errorf("no validate message sent")
	}

	return res, nil
}

func (dp *DockerMonoidProtocol) Query(
	ctx context.Context,
	config map[string]interface{},
	query monoidprotocol.MonoidQuery,
) (chan monoidprotocol.MonoidRecord, error) {
	msgChan, err := dp.runCmdLiveLogs(
		ctx,
		"query",
		map[string]interface{}{
			"-c": config,
			"-q": query,
		},
	)

	if err != nil {
		return nil, err
	}

	msgChan = collectLogs(msgChan, dp.logChan)
	recordChan := readRecords(msgChan)

	return recordChan, nil
}

func (dp *DockerMonoidProtocol) Sample(
	ctx context.Context,
	config map[string]interface{},
	schemas monoidprotocol.MonoidSchemasMessage,
) (chan monoidprotocol.MonoidRecord, error) {
	msgChan, err := dp.runCmdLiveLogs(
		ctx,
		"sample",
		map[string]interface{}{
			"-c": config,
			"-s": schemas,
		},
	)

	if err != nil {
		return nil, err
	}

	msgChan = collectLogs(msgChan, dp.logChan)
	recordChan := readRecords(msgChan)

	return recordChan, nil
}

func (dp *DockerMonoidProtocol) Delete(
	ctx context.Context,
	config map[string]interface{},
	query monoidprotocol.MonoidQuery,
) (chan monoidprotocol.MonoidRecord, error) {
	msgChan, err := dp.runCmdLiveLogs(
		ctx,
		"sample",
		map[string]interface{}{
			"-c": config,
			"-q": query,
		},
	)

	if err != nil {
		return nil, err
	}

	msgChan = collectLogs(msgChan, dp.logChan)
	recordChan := readRecords(msgChan)

	return recordChan, nil
}

func (dp *DockerMonoidProtocol) Schema(
	ctx context.Context,
	config map[string]interface{},
) (*monoidprotocol.MonoidSchemasMessage, error) {
	msgChan, err := dp.runCmdLiveLogs(
		ctx,
		"schema",
		map[string]interface{}{
			"-c": config,
		},
	)

	if err != nil {
		return nil, err
	}

	msgChan = collectLogs(msgChan, dp.logChan)
	var res *monoidprotocol.MonoidSchemasMessage

	for msg := range msgChan {
		if msg.Type != monoidprotocol.MonoidMessageTypeSCHEMA || msg.SchemaMsg == nil {
			log.Debug().Msgf("incorrect message type: %v", msg.Type)
			continue
		}

		res = msg.SchemaMsg
	}

	if res == nil {
		return nil, fmt.Errorf("no schemas message sent")
	}

	return res, nil
}

func (dp *DockerMonoidProtocol) AttachLogs(ctx context.Context) (chan monoidprotocol.MonoidLogMessage, error) {
	dp.logChan = make(chan monoidprotocol.MonoidLogMessage)
	return dp.logChan, nil
}

func (dp *DockerMonoidProtocol) Teardown(ctx context.Context) error {
	if err := dp.teardownContainer(ctx); err != nil {
		return err
	}

	if err := dp.teardownVolumes(ctx); err != nil {
		return err
	}

	if err := dp.client.Close(); err != nil {
		return err
	}

	if dp.logChan != nil {
		close(dp.logChan)
	}

	return nil
}
