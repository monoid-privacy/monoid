package requestactivity

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"go.temporal.io/sdk/activity"
)

// RequestStatusArgs contains the arguments to the RequestStatus activity
type RequestStatusArgs struct {
	RequestStatusID string `json:"requestStatusId"`
}

// RequestStatus calls the request-status function on the data associated with the
// given request.
func (a *RequestActivity) RequestStatusActivity(
	ctx context.Context,
	args RequestStatusArgs,
) (RequestStatusResult, error) {
	logger := activity.GetLogger(ctx)

	requestStatusId := args.RequestStatusID

	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return RequestStatusResult{}, err
	}

	if requestStatus.Status == model.RequestStatusTypeExecuted {
		return RequestStatusResult{FullyComplete: true}, nil
	}

	siloDef := requestStatus.DataSource.SiloDefinition
	siloSpec := siloDef.SiloSpecification

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
	if err != nil {
		return RequestStatusResult{}, err
	}

	defer os.RemoveAll(dir)

	protocol, err := docker.NewDockerMP(siloSpec.DockerImage, siloSpec.DockerTag, dir)
	if err != nil {
		return RequestStatusResult{}, err
	}

	defer protocol.Teardown(ctx)

	logChan, err := protocol.AttachLogs(ctx)
	if err != nil {
		return RequestStatusResult{}, err
	}

	go func() {
		for l := range logChan {
			logger.Debug(l.Message)
		}
	}()

	conf := map[string]interface{}{}
	if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
		return RequestStatusResult{}, err
	}

	handle := monoidprotocol.MonoidRequestHandle{}
	if err := json.Unmarshal([]byte(requestStatus.RequestHandle), &handle); err != nil {
		return RequestStatusResult{}, err
	}

	statCh, err := protocol.RequestStatus(ctx, conf, monoidprotocol.MonoidRequestsMessage{
		Handles: []monoidprotocol.MonoidRequestHandle{handle},
	})

	var status *monoidprotocol.MonoidRequestStatus
	for stat := range statCh {
		stat = stat
		status = &stat
	}

	if status == nil {
		return RequestStatusResult{}, fmt.Errorf("no status was provided")
	}

	return RequestStatusResult{RequestStatus: *status}, nil
}
