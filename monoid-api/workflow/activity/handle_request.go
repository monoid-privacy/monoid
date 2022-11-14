package activity

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"gorm.io/gorm"
)

type combinedErrors struct {
	Errors []string
}

func (c combinedErrors) Error() string {
	return strings.Join(c.Errors, ",")
}

func newCombinedErrors(errors []error) combinedErrors {
	errorStrings := make([]string, len(errors))
	for _, err := range errors {
		errorStrings = append(errorStrings, err.Error())
	}
	return combinedErrors{
		Errors: errorStrings,
	}
}

func failRequest(requestStatusId string, err error, db *gorm.DB) error {
	if flagErr := db.Model(&model.RequestStatus{}).Where("id = ?", requestStatusId).Update("status", model.Failed).Error; flagErr != nil {
		return newCombinedErrors([]error{flagErr, err})
	}
	return err
}

func succeedRequest(requestStatusId string, db *gorm.DB) error {
	if flagErr := db.Model(&model.RequestStatus{}).Where("id = ?", requestStatusId).Update("status", model.Created).Error; flagErr != nil {
		return flagErr
	}
	return nil
}

func (a *Activity) ExecuteRequest(ctx context.Context, requestId string) (*[]monoidprotocol.MonoidRecord, error) {
	var newRecords *[]monoidprotocol.MonoidRecord
	var err error
	allErrors := []error{}
	records := []monoidprotocol.MonoidRecord{}
	request := model.Request{}

	if err := a.Conf.DB.Preload("PrimaryKeyValues").Preload("RequestStatuses").Where("id = ?", requestId).First(&request).Error; err != nil {
		return nil, err
	}

	if request.Type != model.Delete && request.Type != model.Query {
		return nil, errors.New("invalid request type")
	}

	for _, requestStatus := range request.RequestStatuses {
		err = nil
		newRecords, err = a.ExecuteRequestOnDataSource(ctx, requestStatus.ID, request.Type)
		if err != nil {
			allErrors = append(allErrors, err)
		}

		if err = succeedRequest(requestStatus.ID, a.Conf.DB); err != nil {
			allErrors = append(allErrors, err)
		}
		records = append(records, *newRecords...)
	}
	return &records, newCombinedErrors(allErrors)
}

func (a *Activity) QueryUserFromDataSource(ctx context.Context, requestStatusId string) (*[]monoidprotocol.MonoidRecord, error) {
	return nil, nil
}

func (a *Activity) ExecuteRequestOnDataSource(ctx context.Context, requestStatusId string, requestType string) (*[]monoidprotocol.MonoidRecord, error) {
	var conf map[string]interface{}
	var recordChan chan monoidprotocol.MonoidRecord
	var err error

	if requestType != model.Delete && requestType != model.Query {
		return nil, errors.New("invalid request type")
	}

	// TODO: Is this query correct?
	records := []monoidprotocol.MonoidRecord{}
	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("Properties").
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("Request").
		Preload("PrimaryKeyValues").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	request := requestStatus.Request
	primaryKeyValues := request.PrimaryKeyValues
	dataSource := requestStatus.DataSource
	siloDefinition := dataSource.SiloDefinition
	siloSpecification := siloDefinition.SiloSpecification

	primaryKeyMap := make(map[string]string)

	for _, primaryKeyValue := range primaryKeyValues {
		primaryKeyMap[primaryKeyValue.UserPrimaryKeyID] = primaryKeyValue.Value
	}

	protocol, err := docker.NewDockerMP(siloSpecification.DockerImage, siloSpecification.DockerTag)
	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	sch, err := protocol.Schema(context.Background(), conf)

	schema := monoidprotocol.MonoidSchema{}
	found := false
	for _, candidate := range sch.Schemas {
		candidateGroup := ""
		if candidate.Group != nil {
			candidateGroup = *candidate.Group
		}

		desiredGroup := ""
		if dataSource.Group != nil {
			desiredGroup = *dataSource.Group
		}

		if desiredGroup == candidateGroup && candidate.Name == dataSource.Name {
			found = true
			schema = candidate
			break
		}
	}

	if !found {
		return nil, failRequest(requestStatusId, errors.New("could not find dataSource schema"), a.Conf.DB)
	}

	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	primaryKey := ""

	for _, prop := range dataSource.Properties {
		if prop.UserPrimaryKeyID != nil {
			primaryKey = *prop.UserPrimaryKeyID
		}
	}

	if primaryKey == "" {
		// No user primary key in this data source
		return nil, nil
	}

	userKey, ok := primaryKeyMap[primaryKey]
	if !ok {
		return nil, failRequest(requestStatusId, errors.New("data source's primary key type not defined"), a.Conf.DB)
	}

	switch requestType {
	case model.Delete:
		recordChan, err = protocol.Delete(context.Background(), conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{{
				SchemaName:      dataSource.Name,
				SchemaGroup:     dataSource.Group,
				JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
				Identifier:      primaryKey,
				IdentifierQuery: userKey,
			}},
		})
	case model.Query:
		recordChan, err = protocol.Query(context.Background(), conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{{
				SchemaName:      dataSource.Name,
				SchemaGroup:     dataSource.Group,
				JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
				Identifier:      primaryKey,
				IdentifierQuery: userKey,
			}},
		})
	}

	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	for record := range recordChan {
		records = append(records, record)
	}

	return &records, nil
}
