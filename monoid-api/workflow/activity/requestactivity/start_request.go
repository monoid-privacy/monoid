package requestactivity

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/monoid-privacy/monoid/model"
	monoidactivity "github.com/monoid-privacy/monoid/workflow/activity"

	"github.com/monoid-privacy/monoid/monoidprotocol"
	"go.temporal.io/sdk/activity"
)

func findSchema(
	dataSource *model.DataSource,
	schemas *monoidprotocol.MonoidSchemasMessage,
) (monoidprotocol.MonoidSchema, error) {
	for _, candidate := range schemas.Schemas {
		candidateGroup := ""
		if candidate.Group != nil {
			candidateGroup = *candidate.Group
		}

		desiredGroup := ""
		if dataSource.Group != nil {
			desiredGroup = *dataSource.Group
		}

		if desiredGroup == candidateGroup && candidate.Name == dataSource.Name {
			return candidate, nil
		}
	}

	return monoidprotocol.MonoidSchema{}, fmt.Errorf("error finding schema")
}

type RequestStatusError struct {
	Message string `json:"message"`
}

func (m *RequestStatusError) Error() string {
	return m.Message
}

type RequestStatusItem struct {
	// FullyComplete is true if request execution didn't need to occur
	// (the request was already completed, or there is no primary key
	// to use to run a request)
	FullyComplete bool `json:"fullyComplete"`

	// Manual is true if this is a manual silo.
	Manual bool `json:"manual"`

	// RequestStatus is non-empty if FullyComplete is false. It is
	// an encrypted JSON blob of the request status
	RequestStatus *monoidprotocol.MonoidRequestStatus `json:"requestStatus"`

	SchemaGroup     *string
	SchemaName      string
	RequestStatusID string
	Error           *RequestStatusError
}

// RequestStatusResult is the result of any activities dealing with request status
// (start and request status activities)
type RequestStatusResult struct {
	ResultItems []RequestStatusItem `json:"resultItems"`
}

// StartRequestArgs contains the arguments to the StartRequestOnDataSource activity
type StartRequestArgs struct {
	SiloDefinitionID string `json:"siloDefinitionId"`
	RequestID        string `json:"requestId"`
}

// StartRequestOnDataSource starts the request and returns the status
// of the request, along with an indicator of if the request was already
// finished.
func (a *RequestActivity) StartSiloRequestActivity(
	ctx context.Context,
	args StartRequestArgs,
) (RequestStatusResult, error) {
	var conf map[string]interface{}
	logger := activity.GetLogger(ctx)

	siloDef := model.SiloDefinition{}
	request := model.Request{}

	if err := a.Conf.DB.Where(
		"id = ?",
		args.SiloDefinitionID,
	).Preload("DataSources").Preload("DataSources.Properties").Preload("SiloSpecification").Preload(
		"DataSources.RequestStatuses",
		"request_id = ?",
		args.RequestID,
	).First(&siloDef).Error; err != nil {
		return RequestStatusResult{}, err
	}

	if siloDef.SiloSpecification.Manual {
		statuses := make([]RequestStatusItem, 0, len(siloDef.DataSources))

		for _, ds := range siloDef.DataSources {
			if len(ds.RequestStatuses) != 0 {
				statuses = append(statuses, RequestStatusItem{
					FullyComplete:   ds.RequestStatuses[0].Status == model.RequestStatusTypeExecuted,
					RequestStatusID: ds.RequestStatuses[0].ID,
					Manual:          true,
				})
			}
		}

		return RequestStatusResult{ResultItems: statuses}, nil
	}

	if err := a.Conf.DB.Where(
		"id = ?",
		args.RequestID,
	).Preload("PrimaryKeyValues").First(&request).Error; err != nil {
		return RequestStatusResult{}, err
	}

	primaryKeyMap := make(map[string]*model.PrimaryKeyValue)

	for _, primaryKeyValue := range request.PrimaryKeyValues {
		primaryKeyValue := primaryKeyValue
		primaryKeyMap[primaryKeyValue.UserPrimaryKeyID] = &primaryKeyValue
	}

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir(a.Conf.TempStorePath, "monoid")
	if err != nil {
		return RequestStatusResult{}, err
	}

	defer os.RemoveAll(dir)

	protocol, err := a.Conf.ProtocolFactory.NewMonoidProtocol(
		siloDef.SiloSpecification.DockerImage,
		siloDef.SiloSpecification.DockerTag,
		dir,
	)
	if err != nil {
		return RequestStatusResult{}, err
	}

	defer protocol.Teardown(ctx)

	if err := protocol.InitConn(ctx); err != nil {
		return RequestStatusResult{}, err
	}

	logChan, err := protocol.AttachLogs(ctx)
	if err != nil {
		return RequestStatusResult{}, err
	}

	go func() {
		for l := range logChan {
			logger.Info("container-log", "log", l.Message)
		}
	}()

	if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
		return RequestStatusResult{}, err
	}

	sch, err := protocol.Schema(context.Background(), conf)

	if err != nil {
		return RequestStatusResult{}, err
	}

	identifiers := []monoidprotocol.MonoidQueryIdentifier{}
	results := map[string]*RequestStatusItem{}
	dsMap := map[monoidactivity.DataSourceMatcher]*model.DataSource{}

	// Map of request status ID to the corresponding data source
	dsRequestIDMap := map[string]*model.DataSource{}

	// Collect the query identifiers for each data source. If there are no
	// query identifiers for the data source, update the result to fully
	// complete
L:
	for _, ds := range siloDef.DataSources {
		if len(ds.RequestStatuses) == 0 {
			continue
		}

		requestStatus := ds.RequestStatuses[0]
		dsRequestIDMap[requestStatus.ID] = ds

		if requestStatus.Status == model.RequestStatusTypeExecuted {
			results[requestStatus.ID] = &RequestStatusItem{FullyComplete: true}
			continue
		}

		// Verify that the schema exists in the associated data source
		schema, err := findSchema(ds, sch)
		if err != nil {
			logger.Error("Error finding schema", ds.Name, ds.Group)
			results[requestStatus.ID] = &RequestStatusItem{Error: &RequestStatusError{Message: err.Error()}}
			continue
		}

		// Get the primary key from the current
		pkProperties := []*model.Property{}

		for _, prop := range ds.Properties {
			if prop.UserPrimaryKeyID != nil {
				pkProperties = append(pkProperties, prop)
			}
		}

		if len(pkProperties) == 0 {
			results[requestStatus.ID] = &RequestStatusItem{FullyComplete: true}
			continue
		}

		// Get the list of identifiers to use with the action
		for _, p := range pkProperties {
			pkVal, ok := primaryKeyMap[*p.UserPrimaryKeyID]
			if !ok {
				results[requestStatus.ID] = &RequestStatusItem{Error: &RequestStatusError{Message: err.Error()}}
				continue L
			}

			identifiers = append(identifiers, monoidprotocol.MonoidQueryIdentifier{
				SchemaName:      ds.Name,
				SchemaGroup:     ds.Group,
				JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
				Identifier:      p.Name,
				IdentifierQuery: pkVal.Value,
			})
		}

		dsMap[monoidactivity.NewDataSourceMatcher(ds.Name, ds.Group)] = ds
	}

	// Run the delete/query request to get handles for any data sources that
	// aren't already complete.
	if len(identifiers) > 0 {
		var reqChan chan monoidprotocol.MonoidRequestResult
		var statusChan chan int64

		// run the delete or query
		switch request.Type {
		case model.UserDataRequestTypeDelete:
			reqChan, statusChan, err = protocol.Delete(ctx, conf, monoidprotocol.MonoidQuery{
				Identifiers: identifiers,
			})
		case model.UserDataRequestTypeQuery:
			reqChan, statusChan, err = protocol.Query(ctx, conf, monoidprotocol.MonoidQuery{
				Identifiers: identifiers,
			})
		default:
			return RequestStatusResult{}, fmt.Errorf(
				"unknown request type %s",
				string(request.Type),
			)
		}

		if err != nil {
			return RequestStatusResult{}, err
		}

		handleUpdates := map[string]monoidprotocol.MonoidRequestHandle{}

		// Get the data source and update the result for the request status.
		for res := range reqChan {
			ds, ok := dsMap[monoidactivity.NewDataSourceMatcher(
				res.Handle.SchemaName,
				res.Handle.SchemaGroup,
			)]

			if !ok {
				logger.Error("Could not find data source", res.Handle.SchemaName, res.Handle.SchemaGroup)
				continue
			}

			stat := res.Status

			results[ds.RequestStatuses[0].ID] = &RequestStatusItem{
				RequestStatus: &stat,
			}

			handleUpdates[ds.RequestStatuses[0].ID] = res.Handle
		}

		// If the container fails, we fail the entire activity, since the results are not to be trusted
		status := <-statusChan
		if status != 0 {
			return RequestStatusResult{}, fmt.Errorf("container exited with non-zero code (%d)", status)
		}

		// Update the handles for the resulting statuses
		for reqStatID, reqHandle := range handleUpdates {
			handleJSON, err := json.Marshal(reqHandle)
			if err != nil {
				results[reqStatID] = &RequestStatusItem{Error: &RequestStatusError{Message: err.Error()}}
				continue
			}

			if err := a.Conf.DB.Model(&model.RequestStatus{ID: reqStatID}).Update(
				"request_handle", model.SecretString(handleJSON),
			).Error; err != nil {
				results[reqStatID] = &RequestStatusItem{Error: &RequestStatusError{Message: err.Error()}}
				continue
			}
		}
	}

	resultArr := make([]RequestStatusItem, 0, len(siloDef.DataSources))
	for requestID, ds := range dsRequestIDMap {
		res, ok := results[requestID]
		if !ok {
			res = &RequestStatusItem{Error: &RequestStatusError{Message: "No handle provided for data source."}}
		}

		res.SchemaGroup = ds.Group
		res.SchemaName = ds.Name
		res.RequestStatusID = requestID
		resultArr = append(resultArr, *res)
	}

	return RequestStatusResult{ResultItems: resultArr}, nil
}
