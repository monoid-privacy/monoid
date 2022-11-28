package docker

import (
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

	dp.volume = &volName

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

		dp.copyFile(ctx, bytes.NewBuffer(bts), fname)
	}

	return nil
}

func (dp *DockerMonoidProtocol) teardownVolumes(
	ctx context.Context,
) error {
	if dp.volume != nil {
		dp.client.VolumeRemove(ctx, *dp.volume, true)
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
				Type:     "volume",
				ReadOnly: false,
			})
		}

		for k, v := range fileMounts {
			mounts = append(mounts, mount.Mount{
				Source: v,
				Target: "/" + k,
				Type:   mount.TypeBind,
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
) error {
	volumes := []string{}
	if len(jsonFileArgs) != 0 {
		_, err := dp.createVolume(ctx)

		if err != nil {
			return err
		}

		volumes = append(volumes, *dp.volume)
	}

	cmdArr := []string{cmd}

	jsonArgsCp := map[string]interface{}{}
	for k, v := range jsonFileArgs {
		jsonArgsCp[k] = v
	}

	//Test
	fileMounts := map[string]string{}
	for k, v := range persistenceArgs {
		filePath := "/monoid_persist/" + randSeq(8)
		fileMounts[filePath] = v
		jsonArgsCp[k] = monoidprotocol.MonoidPersistenceConfig{
			TempStore: filePath,
		}
	}

	files := map[string]interface{}{}

	for k, v := range jsonArgsCp {
		fileName := randSeq(10)
		fullPath := "/" + *dp.volume + "/" + fileName + ".json"

		cmdArr = append(cmdArr, k, fullPath)
		files[fullPath] = v
	}

	_, err := dp.createContainer(ctx, cmdArr, volumes, fileMounts)

	if err != nil {
		return err
	}

	// Copy the files to the container
	if err = dp.copyJSONObjectFiles(
		ctx, files,
	); err != nil {
		return err
	}

	return nil
}

func (dp *DockerMonoidProtocol) runCmdLiveLogs(
	ctx context.Context,
	cmd string,
	jsonFileArgs map[string]interface{},
	persistenceArgs map[string]string,
) (chan monoidprotocol.MonoidMessage, error) {
	if err := dp.constructContainer(
		ctx,
		cmd,
		jsonFileArgs,
		persistenceArgs,
	); err != nil {
		return nil, err
	}

	// Run the container and get the validate message
	if err := dp.client.ContainerStart(
		ctx,
		*dp.containerID,
		types.ContainerStartOptions{},
	); err != nil {
		return nil, err
	}

	stream, closer, err := dp.containerLogsStream(ctx, true, true)
	if err != nil {
		return nil, err
	}

	messageChan := readMessages(stream, closer)
	return messageChan, nil
}

// runCmdStaticLog runs a docker command on an image, and
// includes the arguments passed in jsonFileArgs as json serialized
// files on the container. Returns the single monoid message that
// is output. If you expect multiple lines of output, use
// runCmdLiveLogs
func (dp *DockerMonoidProtocol) runCmdStaticLog(
	ctx context.Context,
	cmd string,
	jsonFileArgs map[string]interface{},
	persistenceArgs map[string]string,
) (*monoidprotocol.MonoidMessage, error) {
	if err := dp.constructContainer(
		ctx,
		cmd,
		jsonFileArgs,
		persistenceArgs,
	); err != nil {
		return nil, err
	}

	cid := *dp.containerID

	// Run the container and get the validate message
	if err := dp.client.ContainerStart(ctx, cid, types.ContainerStartOptions{}); err != nil {
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

	return &msg, nil
}
