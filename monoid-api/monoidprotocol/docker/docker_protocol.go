package docker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"go.temporal.io/sdk/activity"
)

type DockerMonoidProtocol struct {
	client      *client.Client
	imageName   string
	containerID *string
	volumes     []string
	closeClient bool
}

func NewDockerMPWithClient(dockerImage string, dockerTag string, cli *client.Client, closeClient bool) monoidprotocol.MonoidProtocol {
	imageName := dockerImage + ":" + dockerTag

	return &DockerMonoidProtocol{
		client:      cli,
		imageName:   imageName,
		volumes:     make([]string, 0),
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
	logger := activity.GetLogger(ctx)

	logger.Info("Inspecting", map[string]interface{}{"img": dp.imageName})
	_, _, err := dp.client.ImageInspectWithRaw(ctx, dp.imageName)
	logger.Info("Inspected", map[string]interface{}{"error": err})

	if err != nil {
		_, err := dp.client.ImagePull(ctx, dp.imageName, types.ImagePullOptions{})

		if err != nil {
			return err
		}
	}

	return nil
}

func (dp *DockerMonoidProtocol) Spec(ctx context.Context) (*monoidprotocol.MonoidSiloSpec, error) {
	// logger := activity.GetLogger(ctx)

	cid, err := dp.createContainer(ctx, []string{"spec"}, []string{})

	if err != nil {
		return nil, err
	}

	err = dp.client.ContainerStart(ctx, cid, types.ContainerStartOptions{})
	if err != nil {
		return nil, err
	}

	done, _ := ContainerWait(context.Background(), dp.client, cid)

	<-done

	buf, err := ContainerLogs(ctx, dp.client, cid, true, false)
	if err != nil {
		return nil, err
	}

	msg := monoidprotocol.MonoidMessage{}
	if err := json.NewDecoder(buf).Decode(&msg); err != nil {
		return nil, err
	}

	if msg.Type != monoidprotocol.MonoidMessageTypeSPEC {
		return nil, fmt.Errorf("incorrect message type: %v", msg.Type)
	}

	return msg.Spec, nil
}

func (dp *DockerMonoidProtocol) Validate(ctx context.Context, config map[string]interface{}) (*monoidprotocol.MonoidValidateMessage, error) {
	logger := activity.GetLogger(ctx)
	vid, err := dp.createVolume(ctx)

	if err != nil {
		return nil, err
	}

	confFileName := "/" + vid + "/conf.json"

	cid, err := dp.createContainer(ctx, []string{"validate", "-c", confFileName}, []string{vid})
	logger.Info("Created container", map[string]interface{}{"cid": cid})

	if err != nil {
		return nil, err
	}

	bts, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}

	err = dp.copyFile(ctx, bytes.NewBuffer(bts), confFileName)
	if err != nil {
		return nil, err
	}

	// logger.Info("Starting Container")

	// Run the container and get the validate message
	err = dp.client.ContainerStart(ctx, cid, types.ContainerStartOptions{})
	if err != nil {
		return nil, err
	}

	logger.Info("Started Container")

	done, _ := ContainerWait(context.Background(), dp.client, cid)

	<-done

	buf, err := ContainerLogs(ctx, dp.client, cid, true, false)
	if err != nil {
		return nil, err
	}

	msg := monoidprotocol.MonoidMessage{}
	if err := json.NewDecoder(buf).Decode(&msg); err != nil {
		return nil, err
	}

	if msg.Type != monoidprotocol.MonoidMessageTypeVALIDATE {
		return nil, fmt.Errorf("incorrect message type: %v", msg.Type)
	}

	return msg.ValidateMsg, nil
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

	return nil
}
