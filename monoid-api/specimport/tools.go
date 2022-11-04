package specimport

import (
	"context"

	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/docker/docker/client"
)

// GetFullSpec enriches the manifest entry with the data from the docker image
func GetFullSpec(entry *IntegrationManifestEntry, dockerCli *client.Client) (*IntegrationFullSpecEntry, error) {
	ctx := context.Background()

	mp := docker.NewDockerMPWithClient(entry.DockerImage, entry.DockerTag, dockerCli, false)
	defer mp.Teardown(ctx)

	mp.InitConn(ctx)
	spec, err := mp.Spec(ctx)

	if err != nil {
		return nil, err
	}

	return &IntegrationFullSpecEntry{
		IntegrationManifestEntry: *entry,
		Spec:                     spec.Spec,
	}, nil
}
