package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/dataloader"
	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/requests"
	"github.com/monoid-privacy/monoid/workflow"
	"github.com/monoid-privacy/monoid/workflow/requestworkflow"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
)

// RequestStatuses is the resolver for the requestStatuses field.
func (r *dataSourceResolver) RequestStatuses(ctx context.Context, obj *model.DataSource) ([]*model.RequestStatus, error) {
	return findChildObjects[model.RequestStatus](r.Conf.DB, obj.ID, "data_source_id")
}

// CreateUserPrimaryKey is the resolver for the createUserPrimaryKey field.
func (r *mutationResolver) CreateUserPrimaryKey(ctx context.Context, input model.CreateUserPrimaryKeyInput) (*model.UserPrimaryKey, error) {
	userPrimaryKey := model.UserPrimaryKey{
		ID:            uuid.NewString(),
		Name:          input.Name,
		APIIdentifier: input.APIIdentifier,
		WorkspaceID:   input.WorkspaceID,
	}

	if err := r.Conf.DB.Create(&userPrimaryKey).Error; err != nil {
		return nil, handleError(err, "Error creating userPrimaryKey.")
	}

	return &userPrimaryKey, nil
}

// UpdateUserPrimaryKey is the resolver for the updateUserPrimaryKey field.
func (r *mutationResolver) UpdateUserPrimaryKey(ctx context.Context, input model.UpdateUserPrimaryKeyInput) (*model.UserPrimaryKey, error) {
	userPrimaryKey := model.UserPrimaryKey{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&userPrimaryKey).Error; err != nil {
		return nil, handleError(err, "Error finding user primary key.")
	}

	userPrimaryKey.Name = input.Name

	if err := r.Conf.DB.Save(&userPrimaryKey).Error; err != nil {
		return nil, handleError(err, "Error updating user primary key.")
	}

	return &userPrimaryKey, nil
}

// DeleteUserPrimaryKey is the resolver for the deleteUserPrimaryKey field.
func (r *mutationResolver) DeleteUserPrimaryKey(ctx context.Context, id string) (*string, error) {
	return DeleteObjectByID[model.UserPrimaryKey](id, r.Conf.DB, "Error deleting user primary key.")
}

// UpdateRequestStatus is the resolver for the updateRequestStatus field.
func (r *mutationResolver) UpdateRequestStatus(ctx context.Context, input model.UpdateRequestStatusInput) (*model.RequestStatus, error) {
	status := model.RequestStatus{}
	if err := r.Conf.DB.Where(
		"id = ?",
		input.RequestStatusID,
	).Preload("Request").Preload("Request.Job").Preload(
		"DataSource",
	).First(&status).Error; err != nil {
		return nil, handleError(err, "Could not find request status.")
	}

	if input.ResultData != nil {
		// Validate that the file is a tar.gz file
		gr, err := gzip.NewReader(input.ResultData.File)
		if err != nil {
			return nil, handleError(err, "File must be a gzipped tar file.")
		}

		tr := tar.NewReader(gr)
		if _, err = tr.Next(); err != nil {
			return nil, handleError(err, "File must be a gzipped tar file.")
		}

		// Create a handle to write to the file store
		wr, obj, err := r.Conf.FileStore.NewWriter(ctx, uuid.NewString(), false)
		if err != nil {
			return nil, handleError(err, "Could not upload file.")
		}

		// Reset the reader and write to the file store
		if _, err := input.ResultData.File.Seek(0, io.SeekStart); err != nil {
			return nil, handleError(err, "An unknown error occurred while reading the file.")
		}

		if _, err := io.Copy(wr, input.ResultData.File); err != nil {
			return nil, handleError(err, "Error uploading file.")
		}

		// Get the secret to store as the query result
		rec, err := json.Marshal(model.QueryResultFileData{
			FilePath: obj,
		})

		if err != nil {
			return nil, handleError(err, "An unknown error occurred.")
		}

		ss := model.SecretString(rec)
		if err := r.Conf.DB.Create(&model.QueryResult{
			ID:              uuid.NewString(),
			ResultType:      model.ResultTypeFile,
			RequestStatusID: status.ID,
			Records:         &ss,
		}).Error; err != nil {
			return nil, handleError(err, "Error storing file.")
		}
	}

	var newStatus model.RequestStatusType
	switch input.Status {
	case model.UpdateRequestStatusTypeExecuted:
		newStatus = model.RequestStatusTypeExecuted
	case model.UpdateRequestStatusTypeFailed:
		newStatus = model.RequestStatusTypeFailed
	default:
		newStatus = model.RequestStatusTypeCreated
	}

	if err := r.Conf.DB.Model(&status).Update("status", newStatus).Error; err != nil {
		return nil, handleError(err, "Error updating status")
	}

	if status.Request.Job != nil {
		if err := r.Conf.TemporalClient.SignalWorkflow(
			ctx,
			status.Request.Job.TemporalWorkflowID,
			"",
			requestworkflow.UpdateStatusSignalChannel,
			requestworkflow.UpdateStatusSignal{
				RequestStatusID:  status.ID,
				SiloDefinitionID: status.DataSource.SiloDefinitionID,
			},
		); err != nil {
			log.Err(err).Msg("Error signalling workflow.")
		}
	}

	return &status, nil
}

// CreateUserDataRequest is the resolver for the createUserDataRequest field.
func (r *mutationResolver) CreateUserDataRequest(ctx context.Context, input *model.UserDataRequestInput) (*model.Request, error) {
	request := model.Request{
		ID:          uuid.NewString(),
		WorkspaceID: input.WorkspaceID,
		Type:        input.Type,
	}

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := r.Conf.DB.Create(&request).Error; err != nil {
			return err
		}

		// Get the primary keys that are present in this request.
		primaryKeys := []*model.UserPrimaryKey{}
		apiIdentifiers := make([]string, len(input.PrimaryKeys))
		identifierMap := map[string]string{}

		for i, primaryKey := range input.PrimaryKeys {
			identifierMap[primaryKey.APIIdentifier] = primaryKey.Value
			apiIdentifiers[i] = primaryKey.APIIdentifier
		}

		if err := r.Conf.DB.Where("workspace_id = ?", input.WorkspaceID).Where(
			"api_identifier IN ?",
			apiIdentifiers,
		).Find(&primaryKeys).Error; err != nil {
			return err
		}

		primaryValues := make([]*model.PrimaryKeyValue, len(primaryKeys))
		for i, pk := range primaryKeys {
			primaryValues[i] = &model.PrimaryKeyValue{
				ID:               uuid.NewString(),
				UserPrimaryKeyID: pk.ID,
				Value:            identifierMap[pk.APIIdentifier],
				RequestID:        request.ID,
			}
		}

		if err := r.Conf.DB.Create(&primaryValues).Error; err != nil {
			return err
		}

		siloDefinitions := []*model.SiloDefinition{}
		dataSources := []*model.DataSource{}

		if err := r.Conf.DB.Where(
			"workspace_id = ?",
			input.WorkspaceID,
		).Preload("DataSources").Find(&siloDefinitions).Error; err != nil {
			return err
		}

		for _, sd := range siloDefinitions {
			dataSources = append(dataSources, sd.DataSources...)
		}

		for _, ds := range dataSources {
			requestStatus := model.RequestStatus{
				ID:           uuid.NewString(),
				RequestID:    request.ID,
				DataSourceID: ds.ID,
				Status:       model.RequestStatusTypeCreated,
			}

			if err := r.Conf.DB.Create(&requestStatus).Error; err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		return nil, handleError(err, "Error creating request")
	}

	return &request, nil
}

// ExecuteUserDataRequest is the resolver for the executeUserDataRequest field.
func (r *mutationResolver) ExecuteUserDataRequest(ctx context.Context, requestID string) (*model.Request, error) {
	request := model.Request{}
	if err := r.Conf.DB.Where("id = ?", requestID).First(&request).Error; err != nil {
		return nil, handleError(err, "Error finding request")
	}

	job := model.Job{
		ID:          uuid.NewString(),
		WorkspaceID: request.WorkspaceID,
		JobType:     model.JobTypeExecuteRequest,
		Status:      model.JobStatusQueued,
		ResourceID:  requestID,
	}

	options := client.StartWorkflowOptions{
		ID:        job.ID,
		TaskQueue: workflow.DockerRunnerQueue,
	}

	sf := requestworkflow.RequestWorkflow{
		Conf: r.Conf,
	}

	wf, err := r.Conf.TemporalClient.ExecuteWorkflow(ctx, options, sf.ExecuteRequestWorkflow, requestworkflow.ExecuteRequestArgs{
		RequestID:   requestID,
		WorkspaceID: request.WorkspaceID,
		JobID:       job.ID,
	})

	if err != nil {
		return nil, handleError(err, "Error executing job")
	}

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&job).Error; err != nil {
			return err
		}

		if err != nil {
			return err
		}

		if err := tx.Model(&job).Update("temporal_workflow_id", wf.GetID()).Error; err != nil {
			log.Err(err).Msg("Error uploading workflow ID")
		}

		if err := tx.Model(&request).Update("job_id", &job.ID).Error; err != nil {
			log.Err(err).Msg("Error updating job ID")
		}

		return nil

	}); err != nil {
		return nil, handleError(err, "Error running job.")
	}

	return &request, nil
}

// LinkPropertyToPrimaryKey is the resolver for the linkPropertyToPrimaryKey field.
func (r *mutationResolver) LinkPropertyToPrimaryKey(ctx context.Context, propertyID string, userPrimaryKeyID *string) (*model.Property, error) {
	var property model.Property
	if err := r.Conf.DB.Where("id = ?", propertyID).First(&property).Error; err != nil {
		return nil, handleError(err, "Error linking property to primary key.")
	}

	if err := r.Conf.DB.Model(&property).Update("user_primary_key_id", userPrimaryKeyID).Error; err != nil {
		return nil, handleError(err, "Error linking property to primary key.")
	}

	return &property, nil
}

// GenerateRequestDownloadLink is the resolver for the generateRequestDownloadLink field.
func (r *mutationResolver) GenerateRequestDownloadLink(ctx context.Context, requestID string) (*model.DownloadLink, error) {
	request := model.Request{}

	if err := r.Conf.DB.Where("id = ?", requestID).Preload("Job").First(&request).Error; err != nil {
		return nil, handleError(err, "Could not find the request")
	}

	status, err := request.Status()
	if err != nil {
		return nil, err
	}

	if status == model.FullRequestStatusInProgress ||
		status == model.FullRequestStatusCreated ||
		status == model.FullRequestStatusFailed {
		return nil, handleError(
			fmt.Errorf("request must be completed to get file results"),
			"The request must be completed in order to get file URLs.",
		)
	}

	if request.DownloadableFileID != nil {
		return &model.DownloadLink{
			URL: "/downloads/" + *request.DownloadableFileID,
		}, nil
	}

	res, err := requests.GenerateRequestTar(ctx, r.Conf, request.ID)
	if err != nil {
		return nil, handleError(err, "Error generating file.")
	}

	dlfile := model.DownloadableFile{
		ID:          uuid.NewString(),
		StoragePath: res,
	}

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&dlfile).Error; err != nil {
			return err
		}

		if err := tx.Model(&request).Update("downloadable_file_id", dlfile.ID).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, handleError(err, "Error creating file")
	}

	return &model.DownloadLink{
		URL: "/downloads/" + *request.DownloadableFileID,
	}, nil
}

// GenerateQueryResultDownloadLink is the resolver for the generateQueryResultDownloadLink field.
func (r *mutationResolver) GenerateQueryResultDownloadLink(ctx context.Context, queryResultID string) (*model.DownloadLink, error) {
	qr := model.QueryResult{}
	if err := r.Conf.DB.Where("id = ?", queryResultID).First(&qr).Error; err != nil {
		return nil, handleError(err, "Could not find result")
	}

	if qr.ResultType != model.ResultTypeFile {
		return nil, gqlerror.Errorf("This query result does not have an attached file.")
	}

	if qr.DownloadableFileID == nil {
		fileData := model.QueryResultFileData{}
		if err := json.Unmarshal([]byte(*qr.Records), &fileData); err != nil {
			return nil, handleError(err, "Error reading file")
		}

		dlfile := model.DownloadableFile{
			ID:          uuid.NewString(),
			StoragePath: fileData.FilePath,
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&dlfile).Error; err != nil {
				return err
			}

			if err := tx.Model(&qr).Update("downloadable_file_id", dlfile.ID).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Error creating file")
		}
	}

	return &model.DownloadLink{
		URL: "/downloads/" + *qr.DownloadableFileID,
	}, nil
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *primaryKeyValueResolver) UserPrimaryKey(ctx context.Context, obj *model.PrimaryKeyValue) (*model.UserPrimaryKey, error) {
	return findObjectByID[model.UserPrimaryKey](obj.UserPrimaryKeyID, r.Conf.DB, "Error finding user primary key.")
}

// Request is the resolver for the request field.
func (r *primaryKeyValueResolver) Request(ctx context.Context, obj *model.PrimaryKeyValue) (*model.Request, error) {
	return findObjectByID[model.Request](obj.RequestID, r.Conf.DB, "Error finding request.")
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *propertyResolver) UserPrimaryKey(ctx context.Context, obj *model.Property) (*model.UserPrimaryKey, error) {
	if obj.UserPrimaryKeyID == nil {
		return nil, nil
	}
	userPrimaryKeyId := obj.UserPrimaryKeyID
	return findObjectByID[model.UserPrimaryKey](*userPrimaryKeyId, r.Conf.DB, "Error finding user primary key.")
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *queryResolver) UserPrimaryKey(ctx context.Context, id string) (*model.UserPrimaryKey, error) {
	return findObjectByID[model.UserPrimaryKey](id, r.Conf.DB, "Error finding user primary key.")
}

// RequestStatus is the resolver for the requestStatus field.
func (r *queryResolver) RequestStatus(ctx context.Context, id string) (*model.RequestStatus, error) {
	return findObjectByID[model.RequestStatus](id, r.Conf.DB, "Error finding request status.")
}

// PrimaryKeyValue is the resolver for the primaryKeyValue field.
func (r *queryResolver) PrimaryKeyValue(ctx context.Context, id string) (*model.PrimaryKeyValue, error) {
	return findObjectByID[model.PrimaryKeyValue](id, r.Conf.DB, "Error finding primary key value.")
}

// Request is the resolver for the request field.
func (r *queryResolver) Request(ctx context.Context, id string) (*model.Request, error) {
	request := model.Request{}

	if err := r.Conf.DB.Where(
		"id = ?",
		id,
	).First(&request).Error; err != nil {
		return nil, err
	}

	return &request, nil
}

// RequestStatus is the resolver for the requestStatus field.
func (r *queryResultResolver) RequestStatus(ctx context.Context, obj *model.QueryResult) (*model.RequestStatus, error) {
	return findObjectByID[model.RequestStatus](obj.RequestStatusID, r.Conf.DB, "Error finding request status.")
}

// Records is the resolver for the records field.
func (r *queryResultResolver) Records(ctx context.Context, obj *model.QueryResult) (*string, error) {
	if obj.Records == nil || obj.ResultType != model.ResultTypeRecordsJSON {
		return nil, nil
	}

	s := string(*obj.Records)
	return &s, nil
}

// PrimaryKeyValues is the resolver for the primaryKeyValues field.
func (r *requestResolver) PrimaryKeyValues(ctx context.Context, obj *model.Request) ([]*model.PrimaryKeyValue, error) {
	return findChildObjects[model.PrimaryKeyValue](r.Conf.DB, obj.ID, "request_id")
}

// RequestStatuses is the resolver for the requestStatuses field.
func (r *requestResolver) RequestStatuses(ctx context.Context, obj *model.Request, query *model.RequestStatusQuery, offset *int, limit int) (*model.RequestStatusListResult, error) {
	doffset := 0
	if offset != nil {
		doffset = *offset
	}

	q := r.Conf.DB.Where(
		"request_id = ?",
		obj.ID,
	).Joins(
		"LEFT JOIN data_sources on data_source_id = data_sources.id",
	).Joins(
		"LEFT JOIN silo_definitions on data_sources.silo_definition_id = silo_definitions.id",
	).Joins(
		"LEFT JOIN (?) as result_counts ON result_counts.request_status_id = request_statuses.id",
		r.Conf.DB.Select("request_status_id, COUNT(*) as count").Model(
			model.QueryResult{},
		).Group("request_status_id"),
	)

	if query != nil {
		if len(query.SiloDefinitions) != 0 {
			q = q.Where("silo_definitions.id IN ?", query.SiloDefinitions)
		}
	}

	statuses := []*model.RequestStatus{}
	if err := q.Session(&gorm.Session{}).Order(
		"status desc",
	).Order(
		"COALESCE(result_counts.count, 0) desc",
	).Order(
		"silo_definitions.name desc",
	).Order(
		"data_sources.group desc",
	).Order(
		"data_sources.name desc",
	).Offset(doffset).Limit(limit).Find(&statuses).Error; err != nil {
		return nil, handleError(err, "Error getting request statuses.")
	}

	numStatuses := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.RequestStatus{}).Count(&numStatuses).Error; err != nil {
		return nil, handleError(err, "Error getting request statuses.")
	}

	return &model.RequestStatusListResult{
		RequestStatusRows: statuses,
		NumStatuses:       int(numStatuses),
	}, nil
}

// Status is the resolver for the status field.
func (r *requestResolver) Status(ctx context.Context, obj *model.Request) (model.FullRequestStatus, error) {
	if obj.JobID == nil {
		return model.FullRequestStatusCreated, nil
	}

	job, err := dataloader.Job(ctx, *obj.JobID)

	if err != nil {
		return model.FullRequestStatusCreated, handleError(err, "Error computing status.")
	}

	o := *obj
	o.Job = job

	status, err := o.Status()
	if err != nil {
		return model.FullRequestStatusCreated, handleError(err, "Error finding status")
	}

	return status, nil
}

// Request is the resolver for the request field.
func (r *requestStatusResolver) Request(ctx context.Context, obj *model.RequestStatus) (*model.Request, error) {
	return findObjectByID[model.Request](obj.RequestID, r.Conf.DB, "Error finding request.")
}

// DataSource is the resolver for the dataSource field.
func (r *requestStatusResolver) DataSource(ctx context.Context, obj *model.RequestStatus) (*model.DataSource, error) {
	return dataloader.DataSource(
		context.WithValue(ctx, dataloader.UnscopedKey, true),
		obj.DataSourceID,
	)
}

// QueryResult is the resolver for the queryResult field.
func (r *requestStatusResolver) QueryResult(ctx context.Context, obj *model.RequestStatus) (*model.QueryResult, error) {
	q, err := dataloader.QueryResult(ctx, obj.ID)
	if err != nil {
		return nil, err
	}

	return q, nil
}

// Requests is the resolver for the requests field.
func (r *workspaceResolver) Requests(ctx context.Context, obj *model.Workspace, offset *int, limit int) (*model.RequestsResult, error) {
	offsetD := 0
	if offset != nil {
		offsetD = *offset
	}

	requests := []*model.Request{}
	q := r.Conf.DB.Where("workspace_id = ?", obj.ID)

	if err := q.Session(&gorm.Session{}).Offset(offsetD).Limit(limit).Order(
		"created_at desc, id desc",
	).Find(&requests).Error; err != nil {
		return nil, handleError(err, "Error getting requests")
	}

	numRequests := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.Request{}).Count(&numRequests).Error; err != nil {
		return nil, handleError(err, "Error getting requests")
	}

	return &model.RequestsResult{
		Requests:    requests,
		NumRequests: int(numRequests),
	}, nil
}

// UserPrimaryKeys is the resolver for the userPrimaryKeys field.
func (r *workspaceResolver) UserPrimaryKeys(ctx context.Context, obj *model.Workspace) ([]*model.UserPrimaryKey, error) {
	return findChildObjects[model.UserPrimaryKey](r.Conf.DB, obj.ID, "workspace_id")
}

// PrimaryKeyValue returns generated.PrimaryKeyValueResolver implementation.
func (r *Resolver) PrimaryKeyValue() generated.PrimaryKeyValueResolver {
	return &primaryKeyValueResolver{r}
}

// QueryResult returns generated.QueryResultResolver implementation.
func (r *Resolver) QueryResult() generated.QueryResultResolver { return &queryResultResolver{r} }

// Request returns generated.RequestResolver implementation.
func (r *Resolver) Request() generated.RequestResolver { return &requestResolver{r} }

// RequestStatus returns generated.RequestStatusResolver implementation.
func (r *Resolver) RequestStatus() generated.RequestStatusResolver { return &requestStatusResolver{r} }

type primaryKeyValueResolver struct{ *Resolver }
type queryResultResolver struct{ *Resolver }
type requestResolver struct{ *Resolver }
type requestStatusResolver struct{ *Resolver }
