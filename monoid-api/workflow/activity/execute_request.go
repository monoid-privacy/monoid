package activity

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/google/uuid"
	"go.temporal.io/sdk/activity"
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
	if flagErr := db.Model(&model.RequestStatus{}).Where(
		"id = ?",
		requestStatusId,
	).Update(
		"status",
		model.RequestStatusTypeFailed,
	).Error; flagErr != nil {
		return newCombinedErrors([]error{flagErr, err})
	}

	return err
}

func succeedRequest(requestStatusId string, db *gorm.DB) error {
	if err := db.Model(&model.RequestStatus{}).Where(
		"id = ?",
		requestStatusId,
	).Update(
		"status",
		model.RequestStatusTypeExecuted,
	).Error; err != nil {
		return err
	}

	return nil
}

func (a *Activity) ExecuteRequest(ctx context.Context, requestId string) error {
	allErrors := []error{}
	request := model.Request{}

	if err := a.Conf.DB.Preload(
		"PrimaryKeyValues",
	).Preload("RequestStatuses").Where("id = ?", requestId).First(&request).Error; err != nil {
		return err
	}

	for _, requestStatus := range request.RequestStatuses {
		newRecords, err := a.ExecuteRequestOnDataSource(ctx, requestStatus.ID, request.Type)
		if err != nil {
			allErrors = append(allErrors, err)
		}

		if request.Type == model.UserDataRequestTypeQuery {
			records, err := json.Marshal(newRecords)
			if err != nil {
				allErrors = append(allErrors, err)
			}

			r := model.SecretString(records)

			if err = a.Conf.DB.Create(&model.QueryResult{
				ID:              uuid.NewString(),
				RequestStatusID: requestStatus.ID,
				Records:         &r,
			}).Error; err != nil {
				allErrors = append(allErrors, err)
			}
		}

		if err = succeedRequest(requestStatus.ID, a.Conf.DB); err != nil {
			allErrors = append(allErrors, err)
		}
	}

	allErrorsCombined := newCombinedErrors(allErrors)
	if len(allErrors) == 0 {
		return nil
	}
	return allErrorsCombined
}

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

func safeDeref[T any](p *T) T {
	if p == nil {
		var v T
		return v
	}
	return *p
}

func (a *Activity) ExecuteRequestOnDataSource(
	ctx context.Context,
	requestStatusId string,
	requestType model.UserDataRequestType,
) ([]*monoidprotocol.MonoidRecord, error) {
	var conf map[string]interface{}
	var recordChan chan monoidprotocol.MonoidRecord
	var err error
	logger := activity.GetLogger(ctx)

	records := []*monoidprotocol.MonoidRecord{}
	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("DataSource.Properties").
		Preload("Request").
		Preload("Request.PrimaryKeyValues").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	if requestStatus.Status == model.RequestStatusTypeExecuted {
		return []*monoidprotocol.MonoidRecord{}, nil
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

	defer protocol.Teardown(ctx)

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	sch, err := protocol.Schema(context.Background(), conf)
	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	schema, err := findSchema(&dataSource, sch)
	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	var primaryKeyProperty *model.Property = nil

	for _, prop := range dataSource.Properties {
		if prop.UserPrimaryKeyID != nil {
			primaryKeyProperty = prop
		}
	}

	if primaryKeyProperty == nil {
		// No user primary key in this data source
		return []*monoidprotocol.MonoidRecord{}, nil
	}

	userKey, ok := primaryKeyMap[*primaryKeyProperty.UserPrimaryKeyID]
	if !ok {
		return nil, failRequest(requestStatusId, errors.New("data source's primary key type not defined"), a.Conf.DB)
	}

	primaryKeyIdentifier := model.UserPrimaryKey{}

	if err = a.Conf.DB.Where("id = ?", *primaryKeyProperty.UserPrimaryKeyID).First(
		&primaryKeyIdentifier,
	).Error; err != nil {
		return nil, failRequest(requestStatusId, errors.New("data source's primary key type not defined"), a.Conf.DB)
	}

	identifier := monoidprotocol.MonoidQueryIdentifier{
		SchemaName:      dataSource.Name,
		SchemaGroup:     dataSource.Group,
		JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
		Identifier:      primaryKeyProperty.Name,
		IdentifierQuery: userKey,
	}

	switch requestType {
	case model.UserDataRequestTypeDelete:
		recordChan, err = protocol.Delete(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{identifier},
		})
	case model.UserDataRequestTypeQuery:
		recordChan, err = protocol.Query(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{identifier},
		})
	}

	logger.Debug(
		"Querying:",
		requestStatus.DataSource.SiloDefinition.Name,
		safeDeref(requestStatus.DataSource.Group),
		requestStatus.DataSource.Name,
		identifier,
	)

	if err != nil {
		return nil, failRequest(requestStatusId, err, a.Conf.DB)
	}

	for record := range recordChan {
		records = append(records, &record)
	}

	return records, nil
}
