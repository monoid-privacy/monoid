package requestactivity

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	monoidactivity "github.com/monoid-privacy/monoid/workflow/activity"
	"go.temporal.io/sdk/activity"
)

// RequestStatusArgs contains the arguments to the RequestStatus activity
type RequestStatusArgs struct {
	RequestStatusIDs []string `json:"requestStatusId"`
}

func (a *RequestActivity) processSiloDefStatuses(
	ctx context.Context,
	statuses []model.RequestStatus,
) ([]RequestStatusItem, error) {
	logger := activity.GetLogger(ctx)

	resultMap := map[string]RequestStatusItem{}
	dataSourceMap := map[monoidactivity.DataSourceMatcher]string{}

	if len(statuses) == 0 {
		return []RequestStatusItem{}, nil
	}

	siloDef := statuses[0].DataSource.SiloDefinition
	handles := make([]monoidprotocol.MonoidRequestHandle, 0, len(statuses))

	for _, rs := range statuses {
		if rs.DataSource.SiloDefinitionID != siloDef.ID {
			return nil, fmt.Errorf(
				"this function must be called with request statuses of the same silo def",
			)
		}

		if rs.Status == model.RequestStatusTypeExecuted {
			resultMap[rs.ID] = RequestStatusItem{FullyComplete: true}
			continue
		}

		if siloDef.SiloSpecification.Manual {
			resultMap[rs.ID] = RequestStatusItem{
				RequestStatusID: rs.ID,
				Manual:          true,
			}

			continue
		}

		handle := monoidprotocol.MonoidRequestHandle{}
		if err := json.Unmarshal([]byte(rs.RequestHandle), &handle); err != nil {
			resultMap[rs.ID] = RequestStatusItem{Error: &RequestStatusError{Message: err.Error()}}
			continue
		}

		dataSourceMap[monoidactivity.NewDataSourceMatcher(
			rs.DataSource.Name, rs.DataSource.Group,
		)] = rs.ID

		handles = append(handles, handle)
	}

	if len(handles) != 0 {
		// Create a temporary directory that can be used by the docker container
		dir, err := ioutil.TempDir(a.Conf.TempStorePath, "monoid")
		if err != nil {
			return nil, err
		}

		defer os.RemoveAll(dir)

		protocol, err := a.Conf.ProtocolFactory.NewMonoidProtocol(
			siloDef.SiloSpecification.DockerImage,
			siloDef.SiloSpecification.DockerTag,
			dir,
		)
		if err != nil {
			return nil, err
		}

		defer protocol.Teardown(ctx)

		if err := protocol.InitConn(ctx); err != nil {
			return nil, err
		}

		logChan, err := protocol.AttachLogs(ctx)
		if err != nil {
			return nil, err
		}

		go func() {
			for l := range logChan {
				logger.Info("container-log", "log", l.Message)
			}
		}()

		conf := map[string]interface{}{}
		if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
			return nil, err
		}
		statCh, _, err := protocol.RequestStatus(ctx, conf, monoidprotocol.MonoidRequestsMessage{
			Handles: handles,
		})

		if err != nil {
			return nil, err
		}

		for stat := range statCh {
			stat := stat
			requestID, ok := dataSourceMap[monoidactivity.NewDataSourceMatcher(stat.SchemaName, stat.SchemaGroup)]
			if !ok {
				logger.Error("Did not find schema", stat.SchemaName, stat.SchemaGroup)
			}

			resultMap[requestID] = RequestStatusItem{
				RequestStatus: &stat,
			}
		}
	}

	results := make([]RequestStatusItem, len(statuses))
	for i, s := range statuses {
		res, ok := resultMap[s.ID]
		if !ok {
			res = RequestStatusItem{
				Error: &RequestStatusError{Message: fmt.Sprintf("could not find status for %s", s.ID)},
			}
		}

		res.RequestStatusID = s.ID
		res.SchemaGroup = s.DataSource.Group
		res.SchemaName = s.DataSource.Name

		results[i] = res
	}

	return results, nil
}

// RequestStatusActivity calls the request-status function on the data associated with the
// given request.
func (a *RequestActivity) RequestStatusActivity(
	ctx context.Context,
	args RequestStatusArgs,
) (RequestStatusResult, error) {
	requestStatus := []model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Where("id = ?", args.RequestStatusIDs).First(&requestStatus).Error; err != nil {
		return RequestStatusResult{}, err
	}

	siloMap := map[string][]model.RequestStatus{}
	for _, rs := range requestStatus {
		siloDefID := rs.DataSource.SiloDefinitionID
		if _, ok := siloMap[siloDefID]; !ok {
			siloMap[siloDefID] = []model.RequestStatus{}
		}

		siloMap[siloDefID] = append(siloMap[siloDefID], rs)
	}

	results := []RequestStatusItem{}
	for _, statuses := range siloMap {
		res, err := a.processSiloDefStatuses(ctx, statuses)
		if err != nil {
			for _, s := range statuses {
				results = append(results, RequestStatusItem{
					SchemaGroup:     s.DataSource.Group,
					SchemaName:      s.DataSource.Name,
					RequestStatusID: s.ID,
					Error:           &RequestStatusError{Message: "error processing silo"},
				})
			}

			continue
		}

		results = append(results, res...)
	}

	return RequestStatusResult{ResultItems: results}, nil
}
