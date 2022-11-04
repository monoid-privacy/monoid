package docker

import (
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/volume"
)

// createVolume creates a docker volume and returns the name of the volume
func (dp *DockerMonoidProtocol) createVolume(
	ctx context.Context,
) (string, error) {
	volName := fmt.Sprintf("monoid_%s", randSeq(10))

	vol, err := dp.client.VolumeCreate(ctx, volume.VolumeCreateBody{
		Driver:     "local",
		DriverOpts: map[string]string{},
		Labels:     map[string]string{},
		Name:       volName,
	})

	if err != nil {
		return "", err
	}

	dp.volumes = append(dp.volumes, volName)

	return vol.Name, nil
}

func (dp *DockerMonoidProtocol) copyFile(
	ctx context.Context,
	f io.Reader,
	dest string,
) error {
	return dp.client.CopyToContainer(ctx, *dp.containerID, dest, f, types.CopyToContainerOptions{})
}

func (dp *DockerMonoidProtocol) teardownVolumes(
	ctx context.Context,
) error {
	for _, v := range dp.volumes {
		dp.client.VolumeRemove(ctx, v, true)
	}

	return nil
}

func (dp *DockerMonoidProtocol) teardownContainer(
	ctx context.Context,
) error {
	if dp.containerID == nil {
		return nil
	}

	return dp.client.ContainerRemove(ctx, *dp.containerID, types.ContainerRemoveOptions{
		RemoveVolumes: true,
	})
}

func (dp *DockerMonoidProtocol) createContainer(
	ctx context.Context,
	cmd []string,
	volumes []string,
) (string, error) {
	if dp.containerID != nil {
		if err := dp.teardownContainer(ctx); err != nil {
			return "", err
		}
	}

	cfg := container.Config{
		Image: dp.imageName,
		Cmd:   cmd,
	}

	var hostConfig *container.HostConfig = nil

	if len(volumes) != 0 {
		mounts := make([]mount.Mount, len(volumes))
		for i, v := range volumes {
			mounts[i] = mount.Mount{
				Source:   v,
				Target:   "/" + v,
				Type:     "volume",
				ReadOnly: false,
			}
		}

		hostConfig = &container.HostConfig{
			Mounts: mounts,
		}
	}

	ctr, err := dp.client.ContainerCreate(ctx, &cfg, hostConfig, nil, nil, "")

	if err != nil {
		return "", err
	}

	dp.containerID = &ctr.ID

	return ctr.ID, nil
}
