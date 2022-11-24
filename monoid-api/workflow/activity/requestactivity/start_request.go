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

// RequestStatusResult is the result of any activities dealing with request status
// (start and request status activities)
type RequestStatusResult struct {
	// FullyComplete is true if request execution didn't need to occur
	// (the request was already completed, or there is no primary key
	// to use to run a request)
	FullyComplete bool `json:"fullyComplete"`

	// RequestStatus is non-empty if FullyComplete is false. It is
	// an encrypted JSON blob of the request status
	RequestStatus monoidprotocol.MonoidRequestStatus `json:"requestStatus"`
}

// StartRequestArgs contains the arguments to the StartRequestOnDataSource activity
type StartRequestArgs struct {
	RequestStatusID string `json:"requestStatusId"`
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

	requestStatusId := args.RequestStatusID

	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("DataSource.Properties").
		Preload("Request").
		Preload("Request.PrimaryKeyValues").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return RequestStatusResult{}, err
	}

	if requestStatus.Status == model.RequestStatusTypeExecuted {
		return RequestStatusResult{FullyComplete: true}, nil
	}

	request := requestStatus.Request
	primaryKeyValues := request.PrimaryKeyValues
	dataSource := requestStatus.DataSource
	siloDefinition := dataSource.SiloDefinition
	siloSpecification := siloDefinition.SiloSpecification

	primaryKeyMap := make(map[string]*model.PrimaryKeyValue)

	for _, primaryKeyValue := range primaryKeyValues {
		primaryKeyValue := primaryKeyValue
		primaryKeyMap[primaryKeyValue.UserPrimaryKeyID] = &primaryKeyValue
	}

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
	if err != nil {
		return RequestStatusResult{}, err
	}

	defer os.RemoveAll(dir)

	protocol, err := docker.NewDockerMP(
		siloSpecification.DockerImage,
		siloSpecification.DockerTag,
		dir,
	)
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

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return RequestStatusResult{}, err
	}

	sch, err := protocol.Schema(context.Background(), conf)

	if err != nil {
		return RequestStatusResult{}, err
	}

	schema, err := findSchema(&dataSource, sch)
	if err != nil {
		return RequestStatusResult{}, err
	}

	// Get the primary key from the current
	pkProperties := []*model.Property{}

	for _, prop := range dataSource.Properties {
		if prop.UserPrimaryKeyID != nil {
			pkProperties = append(pkProperties, prop)
		}
	}

	if len(pkProperties) == 0 {
		// No user primary key in this data source
		return RequestStatusResult{FullyComplete: true}, nil
	}

	// Get the list of identifiers to use with the action
	identifiers := make([]monoidprotocol.MonoidQueryIdentifier, 0, len(pkProperties))
	for _, p := range pkProperties {
		pkVal, ok := primaryKeyMap[*p.UserPrimaryKeyID]
		if !ok {
			return RequestStatusResult{}, fmt.Errorf("data source's primary key type not defined")
		}

		identifiers = append(identifiers, monoidprotocol.MonoidQueryIdentifier{
			SchemaName:      dataSource.Name,
			SchemaGroup:     dataSource.Group,
			JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
			Identifier:      p.Name,
			IdentifierQuery: pkVal.Value,
		})
	}

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

	var result *monoidprotocol.MonoidRequestResult
	for res := range reqChan {
		result = &res
	}

	if result == nil {
		return RequestStatusResult{}, fmt.Errorf("error reading request from protocol")
	}

	handleJSON, err := json.Marshal(result.Handle)
	if err != nil {
		return RequestStatusResult{}, err
	}

	if err := a.Conf.DB.Model(&requestStatus).Update(
		"request_handle", model.SecretString(handleJSON),
	).Error; err != nil {
		return RequestStatusResult{}, err
	}

	return RequestStatusResult{RequestStatus: result.Status}, nil
}
