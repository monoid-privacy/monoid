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
type DataSourceRequestStatusArgs struct {
	RequestStatusID string `json:"requestStatusId"`
}

// RequestStatus calls the request-status function on the data associated with the
// given request.
func (a *RequestActivity) RequestStatusActivity(
	ctx context.Context,
	args DataSourceRequestStatusArgs,
) (RequestStatusItem, error) {
	logger := activity.GetLogger(ctx)

	requestStatusId := args.RequestStatusID

	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return RequestStatusItem{}, err
	}

	if requestStatus.Status == model.RequestStatusTypeExecuted {
		return RequestStatusItem{FullyComplete: true}, nil
	}

	siloDef := requestStatus.DataSource.SiloDefinition
	siloSpec := siloDef.SiloSpecification

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
	if err != nil {
		return RequestStatusItem{}, err
	}

	defer os.RemoveAll(dir)

	protocol, err := docker.NewDockerMP(siloSpec.DockerImage, siloSpec.DockerTag, dir)
	if err != nil {
		return RequestStatusItem{}, err
	}

	defer protocol.Teardown(ctx)

	logChan, err := protocol.AttachLogs(ctx)
	if err != nil {
		return RequestStatusItem{}, err
	}

	go func() {
		for l := range logChan {
			logger.Debug(l.Message)
		}
	}()

	conf := map[string]interface{}{}
	if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
		return RequestStatusItem{}, err
	}

	handle := monoidprotocol.MonoidRequestHandle{}
	if err := json.Unmarshal([]byte(requestStatus.RequestHandle), &handle); err != nil {
		return RequestStatusItem{}, err
	}

	statCh, err := protocol.RequestStatus(ctx, conf, monoidprotocol.MonoidRequestsMessage{
		Handles: []monoidprotocol.MonoidRequestHandle{handle},
	})

	if err != nil {
		return RequestStatusItem{}, err
	}

	var status *monoidprotocol.MonoidRequestStatus
	for stat := range statCh {
		stat := stat
		status = &stat
	}

	if status == nil {
		return RequestStatusItem{}, fmt.Errorf("no status was provided")
	}

	return RequestStatusItem{RequestStatus: status}, nil
}
