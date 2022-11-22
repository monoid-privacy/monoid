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
) error {
	var conf map[string]interface{}
	logger := activity.GetLogger(ctx)

	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("DataSource.Properties").
		Preload("Request").
		Preload("Request.PrimaryKeyValues").
		Where("id = ?", requestStatusId).First(&requestStatus).Error; err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	if requestStatus.Status == model.RequestStatusTypeExecuted {
		return nil
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

	protocol, err := docker.NewDockerMP(siloSpecification.DockerImage, siloSpecification.DockerTag)
	if err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	defer protocol.Teardown(ctx)

	logChan, err := protocol.AttachLogs(ctx)
	if err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	go func() {
		for l := range logChan {
			logger.Debug(l.Message)
		}
	}()

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	sch, err := protocol.Schema(context.Background(), conf)

	if err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	schema, err := findSchema(&dataSource, sch)
	if err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	// Get the primary key from the current
	pkProperties := []*model.Property{}

	for _, prop := range dataSource.Properties {
		if prop.UserPrimaryKeyID != nil {
			pkProperties = append(pkProperties, prop)
		}
	}

	if len(pkProperties) == 0 {
		if err = succeedRequest(requestStatus.ID, a.Conf.DB); err != nil {
			return err
		}

		// No user primary key in this data source
		return nil
	}

	// Get the list of identifiers to use with the action
	identifiers := make([]monoidprotocol.MonoidQueryIdentifier, 0, len(pkProperties))
	for _, p := range pkProperties {
		pkVal, ok := primaryKeyMap[*p.UserPrimaryKeyID]
		if !ok {
			return failRequest(requestStatusId, errors.New("data source's primary key type not defined"), a.Conf.DB)
		}

		identifiers = append(identifiers, monoidprotocol.MonoidQueryIdentifier{
			SchemaName:      dataSource.Name,
			SchemaGroup:     dataSource.Group,
			JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema.JsonSchema),
			Identifier:      p.Name,
			IdentifierQuery: pkVal.Value,
		})
	}

	var recordChan chan monoidprotocol.MonoidRecord

	// run the delete or query
	switch request.Type {
	case model.UserDataRequestTypeDelete:
		recordChan, err = protocol.Delete(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: identifiers,
		})
	case model.UserDataRequestTypeQuery:
		recordChan, err = protocol.Query(ctx, conf, monoidprotocol.MonoidQuery{
			Identifiers: identifiers,
		})
	}

	logger.Debug(
		"Querying:",
		requestStatus.DataSource.SiloDefinition.Name,
		safeDeref(requestStatus.DataSource.Group),
		requestStatus.DataSource.Name,
	)

	if err != nil {
		return failRequest(requestStatusId, err, a.Conf.DB)
	}

	// Read the return data
	res := []*monoidprotocol.MonoidRecordData{}

	for record := range recordChan {
		res = append(res, &record.Data)
	}

	// Write the records back to the db
	if request.Type == model.UserDataRequestTypeQuery {
		records, err := json.Marshal(res)
		if err != nil {
			return err
		}

		r := model.SecretString(records)

		if err = a.Conf.DB.Create(&model.QueryResult{
			ID:              uuid.NewString(),
			RequestStatusID: requestStatus.ID,
			Records:         &r,
		}).Error; err != nil {
			return err
		}
	}

	if err = succeedRequest(requestStatus.ID, a.Conf.DB); err != nil {
		return err
	}

	return nil
}
