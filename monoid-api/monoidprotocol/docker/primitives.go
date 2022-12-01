package docker

import (
	"archive/tar"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/volume"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	"github.com/monoid-privacy/monoid/tartools"
	"github.com/rs/zerolog/log"
)

// createVolume creates a docker volume and returns the name of the volume
func (dp *DockerMonoidProtocol) createVolume(
	ctx context.Context,
) (string, error) {
	volName := fmt.Sprintf("monoid_%s", randSeq(10))

	vol, err := dp.client.VolumeCreate(ctx, volume.CreateOptions{
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
	path, filename := filepath.Split(dest)
	wrapped, err := tartools.WrapInTar(f, filename)

	if err != nil {
		return err
	}

	defer wrapped.Close()

	// logger := activity.GetLogger(ctx)
	// logger.Info("CTR ID", map[string]string{"ctr": *dp.containerID, "dest": path})

	return dp.client.CopyToContainer(ctx, *dp.containerID, path, wrapped, types.CopyToContainerOptions{})
}

func (dp *DockerMonoidProtocol) copyJSONObjectFiles(
	ctx context.Context,
	files map[string]interface{},
) error {
	for fname, obj := range files {
		bts, err := json.Marshal(obj)
		if err != nil {
			return err
		}

		if err := dp.copyFile(ctx, bytes.NewBuffer(bts), fname); err != nil {
			return err
		}
	}

	return nil
}

func (dp *DockerMonoidProtocol) teardownVolumes(
	ctx context.Context,
) error {
	for _, v := range dp.volumes {
		if err := dp.client.VolumeRemove(ctx, v, true); err != nil {
			log.Err(err).Msg("Error removing volume")
		}
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

func (dp *DockerMonoidProtocol) containerLogsStream(
	ctx context.Context,
	stdout bool,
	stderr bool,
) (chan []byte, io.Closer, error) {
	if dp.containerID == nil {
		return nil, nil, fmt.Errorf("container not initialized")
	}

	res, err := dp.client.ContainerLogs(ctx, *dp.containerID, types.ContainerLogsOptions{
		ShowStdout: stdout,
		ShowStderr: stderr,
		Follow:     true,
	})

	if err != nil {
		return nil, nil, err
	}

	sc := bufio.NewScanner(res)
	logChan := make(chan []byte)

	go func() {
		for sc.Scan() {
			bts := sc.Bytes()
			logChan <- bts
		}

		close(logChan)
	}()

	return logChan, res, nil
}

func (dp *DockerMonoidProtocol) createContainer(
	ctx context.Context,
	cmd []string,
	volumes []string,
	fileMounts map[string]string,
) (string, error) {
	if dp.containerID != nil {
		if err := dp.teardownContainer(ctx); err != nil {
			return "", err
		}
	}

	cfg := container.Config{
		Image: dp.imageName,
		Cmd:   cmd,
		Tty:   true,
	}

	var hostConfig *container.HostConfig = nil

	if len(volumes) != 0 || len(fileMounts) != 0 {
		mounts := make([]mount.Mount, 0, len(volumes)+len(fileMounts))
		for _, v := range volumes {
			mounts = append(mounts, mount.Mount{
				Source:   v,
				Target:   "/" + v,
				Type:     mount.TypeVolume,
				ReadOnly: false,
			})
		}

		for k, v := range fileMounts {
			mounts = append(mounts, mount.Mount{
				Source:   v,
				Target:   "/" + k,
				Type:     mount.TypeVolume,
				ReadOnly: false,
			})
		}

		hostConfig = &container.HostConfig{
			Mounts: mounts,
		}
	}

	ctr, err := dp.client.ContainerCreate(ctx, &cfg, hostConfig, nil, nil, "")

	if err != nil {
		return "", err
	}

	containerID := ctr.ID
	dp.containerID = &containerID

	return ctr.ID, nil
}

// constructContainer creates a docker container that includes the
// command cmd with the files specified as arguments, but does not run
// the container
func (dp *DockerMonoidProtocol) constructContainer(
	ctx context.Context,
	cmd string,
	jsonFileArgs map[string]interface{},
	persistenceArgs map[string]string,
) (fileOutputs map[string]string, err error) {
	fileVolumes := []string{}
	if len(jsonFileArgs) != 0 {
		volume, err := dp.createVolume(ctx)

		if err != nil {
			return nil, err
		}

		fileVolumes = append(fileVolumes, volume)
	}

	cmdArr := []string{cmd}

	jsonArgsCp := map[string]interface{}{}
	for k, v := range jsonFileArgs {
		jsonArgsCp[k] = v
	}

	fileOutputs = map[string]string{}
	mounts := map[string]string{}
	for k, v := range persistenceArgs {
		vol, err := dp.createVolume(ctx)

		if err != nil {
			return nil, err
		}

		filePath := "/monoid_persist/" + randSeq(8)
		fileOutputs[filePath] = v
		mounts[filePath] = vol

		jsonArgsCp[k] = monoidprotocol.MonoidPersistenceConfig{
			TempStore: filePath,
		}
	}

	files := map[string]interface{}{}

	for k, v := range jsonArgsCp {
		fileName := randSeq(10)
		fullPath := "/" + fileVolumes[0] + "/" + fileName + ".json"

		cmdArr = append(cmdArr, k, fullPath)
		files[fullPath] = v
	}

	_, err = dp.createContainer(ctx, cmdArr, fileVolumes, mounts)

	if err != nil {
		return nil, err
	}

	// Copy the files to the container
	if err = dp.copyJSONObjectFiles(
		ctx, files,
	); err != nil {
		return nil, err
	}

	return fileOutputs, nil
}

func (dp *DockerMonoidProtocol) runCmdLiveLogs(
	ctx context.Context,
	cmd string,
	jsonFileArgs map[string]interface{},
	persistenceArgs map[string]string,
	copyFiles bool,
) (messageChan chan monoidprotocol.MonoidMessage, completeCh chan int64, err error) {
	fileMounts, err := dp.constructContainer(
		ctx,
		cmd,
		jsonFileArgs,
		persistenceArgs,
	)

	if err != nil {
		return nil, nil, err
	}

	// Run the container and get the validate message
	if err := dp.client.ContainerStart(
		ctx,
		*dp.containerID,
		types.ContainerStartOptions{},
	); err != nil {
		return nil, nil, err
	}

	stream, closer, err := dp.containerLogsStream(ctx, true, true)
	if err != nil {
		return nil, nil, err
	}

	messageChan = readMessages(stream, closer)
	completeCh = make(chan int64, 1)

	waitCh, errCh := dp.client.ContainerWait(ctx, *dp.containerID, container.WaitConditionNextExit)
	go func() {
		select {
		case <-ctx.Done():
			close(completeCh)
			return
		case w := <-waitCh:
			if copyFiles {
				for k, v := range fileMounts {
					r, _, err := dp.client.CopyFromContainer(ctx, *dp.containerID, k)
					if err != nil {
						log.Err(err).Msg("Error copying from container")
						continue
					}

					defer r.Close()

					tr := tar.NewReader(r)
					err = tartools.CopyTarToDir(tr, v)
					if err != nil {
						log.Err(err).Msg("Error copying files to container")
					}
				}
			}

			completeCh <- w.StatusCode
			close(completeCh)
			return
		case err := <-errCh:
			if err != nil {
				log.Err(err).Msg("Error waiting on container.")
			}

			completeCh <- 1
			close(completeCh)
			return
		}
	}()

	return messageChan, completeCh, nil
}
