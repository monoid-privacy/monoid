package docker

import (
	"bytes"
	"context"
	"crypto/rand"
	"io"
	"math/big"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyz")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		b[i] = letters[j.Int64()]
	}
	return string(b)
}

func ContainerWait(ctx context.Context, cli *client.Client, containerID string) (chan int, chan error) {
	done := make(chan int)
	errc := make(chan error)
	statusCh, errCh := cli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
	go func() {
		select {
		case err := <-errCh:
			if err != nil {
				errc <- err
				return
			}
		case status := <-statusCh:
			done <- int(status.StatusCode)
		}
	}()

	return done, errc
}

func ContainerLogs(ctx context.Context, cli *client.Client, containerID string, stdout bool, stderr bool) (io.Reader, error) {
	var buf bytes.Buffer

	res, err := cli.ContainerLogs(ctx, containerID, types.ContainerLogsOptions{
		ShowStdout: stdout,
		ShowStderr: stderr,
	})
	if err != nil {
		return nil, err
	}

	stdcopy.StdCopy(&buf, &buf, res)
	defer res.Close()

	return &buf, nil
}
