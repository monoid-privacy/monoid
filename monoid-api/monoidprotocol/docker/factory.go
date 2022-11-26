package docker

import "github.com/brist-ai/monoid/monoidprotocol"

type DockerProtocolFactory struct{}

func (d *DockerProtocolFactory) NewMonoidProtocol(
	dockerImage string, dockerTag string, persistDir string,
) (monoidprotocol.MonoidProtocol, error) {
	return NewDockerMP(dockerImage, dockerTag, persistDir)
}
