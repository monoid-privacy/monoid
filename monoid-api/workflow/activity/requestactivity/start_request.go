package requestactivity

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/brist-ai/monoid/model"
	monoidactivity "github.com/brist-ai/monoid/workflow/activity"

	"github.com/brist-ai/monoid/monoidprotocol"
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
func (a *RequestActivity) StartDataSourceRequestActivity(
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
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
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
			logger.Debug(l.Message)
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
	errorIDs := map[string]error{}
	results := map[string]*RequestStatusItem{}
	dsMap := map[monoidactivity.DataSourceMatcher]*model.DataSource{}
	dsRequestIDMap := map[string]*model.DataSource{}

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
			errorIDs[requestStatus.ID] = err
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
				errorIDs[requestStatus.ID] = fmt.Errorf("data source's primary key type not defined")
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

	logger.Info("Identifiers", identifiers)

	var reqChan chan monoidprotocol.MonoidRequestResult

	// run the delete or query
	switch request.Type {
	case model.UserDataRequestTypeDelete:
		reqChan, err = protocol.Delete(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: identifiers,
		})
	case model.UserDataRequestTypeQuery:
		reqChan, err = protocol.Query(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: identifiers,
		})
	}

	if err != nil {
		return RequestStatusResult{}, err
	}

	handleUpdates := map[string]monoidprotocol.MonoidRequestHandle{}

	for res := range reqChan {
		ds, ok := dsMap[monoidactivity.NewDataSourceMatcher(
			res.Handle.SchemaName,
			res.Handle.SchemaGroup,
		)]

		if !ok {
			logger.Error("Could not find data source", res.Handle.SchemaName, res.Handle.SchemaGroup)
			continue
		}

		results[ds.RequestStatuses[0].ID] = &RequestStatusItem{
			RequestStatus: &res.Status,
		}

		handleUpdates[ds.RequestStatuses[0].ID] = res.Handle
	}

	for reqStatID, reqHandle := range handleUpdates {
		handleJSON, err := json.Marshal(reqHandle)
		if err != nil {
			errorIDs[reqStatID] = err
		}

		if err := a.Conf.DB.Model(&model.RequestStatus{ID: reqStatID}).Update(
			"request_handle", model.SecretString(handleJSON),
		).Error; err != nil {
			errorIDs[reqStatID] = err
		}
	}

	resultArr := make([]RequestStatusItem, 0, len(siloDef.DataSources))
	for k, v := range results {
		if _, ok := errorIDs[k]; ok {
			continue
		}

		ds, ok := dsRequestIDMap[k]
		if !ok {
			continue
		}

		v.SchemaGroup = ds.Group
		v.SchemaName = ds.Name
		v.RequestStatusID = k
		resultArr = append(resultArr, *v)
	}

	for k, err := range errorIDs {
		resultArr = append(resultArr, RequestStatusItem{
			RequestStatusID: k,
			Error:           &RequestStatusError{Message: err.Error()},
		})
	}

	return RequestStatusResult{ResultItems: resultArr}, nil
}
