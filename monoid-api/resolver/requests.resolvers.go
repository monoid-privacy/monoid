package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow"
	"github.com/google/uuid"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
)

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
func (r *mutationResolver) ExecuteUserDataRequest(ctx context.Context, requestID string, workspaceID string) (*model.Job, error) {
	job := model.Job{
		ID:          uuid.NewString(),
		WorkspaceID: workspaceID,
		JobType:     model.JobTypeExecuteRequest,
		Status:      model.JobStatusQueued,
		ResourceID:  requestID,
	}

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&job).Error; err != nil {
			return err
		}

		options := client.StartWorkflowOptions{
			ID:        job.ID,
			TaskQueue: workflow.DockerRunnerQueue,
		}

		sf := workflow.Workflow{
			Conf: r.Conf,
		}

		_, err := r.Conf.TemporalClient.ExecuteWorkflow(ctx, options, sf.ExecuteRequestWorkflow, workflow.ExecuteRequestArgs{
			RequestID:   requestID,
			WorkspaceID: workspaceID,
			JobID:       job.ID,
		})

		if err != nil {
			return err
		}

		return nil

	}); err != nil {
		return nil, handleError(err, "Error running job.")
	}

	return &job, nil
}

// LinkPropertyToPrimaryKey is the resolver for the linkPropertyToPrimaryKey field.
func (r *mutationResolver) LinkPropertyToPrimaryKey(ctx context.Context, propertyID string, userPrimaryKeyID string) (*model.LinkPropertyToPrimaryKeyResponse, error) {
	var property model.Property
	if err := r.Conf.DB.Where("id = ?", propertyID).First(&property).Error; err != nil {
		return nil, handleError(err, "Error linking property to primary key.")
	}

	property.UserPrimaryKeyID = &userPrimaryKeyID
	if err := r.Conf.DB.Save(&property).Error; err != nil {
		return nil, handleError(err, "Error linking property to primary key.")
	}

	return &model.LinkPropertyToPrimaryKeyResponse{
		UserPrimaryKeyID: userPrimaryKeyID,
		PropertyID:       propertyID,
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
func (r *queryResolver) UserPrimaryKey(ctx context.Context, id string) (*model.UserPrimaryKey, error) {
	return findObjectByID[model.UserPrimaryKey](id, r.Conf.DB, "Error finding user primary key.")
}

// Request is the resolver for the request field.
func (r *queryResolver) Request(ctx context.Context, id string) (*model.Request, error) {
	return findObjectByID[model.Request](id, r.Conf.DB, "Error finding request.")
}

// RequestStatus is the resolver for the requestStatus field.
func (r *queryResolver) RequestStatus(ctx context.Context, id string) (*model.RequestStatus, error) {
	return findObjectByID[model.RequestStatus](id, r.Conf.DB, "Error finding request status.")
}

// PrimaryKeyValue is the resolver for the primaryKeyValue field.
func (r *queryResolver) PrimaryKeyValue(ctx context.Context, id string) (*model.PrimaryKeyValue, error) {
	return findObjectByID[model.PrimaryKeyValue](id, r.Conf.DB, "Error finding primary key value.")
}

// RequestStatus is the resolver for the requestStatus field.
func (r *queryRecordResolver) RequestStatus(ctx context.Context, obj *model.QueryRecord) (*model.RequestStatus, error) {
	return findObjectByID[model.RequestStatus](obj.RequestStatusID, r.Conf.DB, "Error finding request status.")
}

// PrimaryKeyValues is the resolver for the primaryKeyValues field.
func (r *requestResolver) PrimaryKeyValues(ctx context.Context, obj *model.Request) ([]*model.PrimaryKeyValue, error) {
	return findChildObjects[model.PrimaryKeyValue](r.Conf.DB, obj.ID, "request_id")
}

// RequestStatuses is the resolver for the requestStatuses field.
func (r *requestResolver) RequestStatuses(ctx context.Context, obj *model.Request) ([]*model.RequestStatus, error) {
	return findChildObjects[model.RequestStatus](r.Conf.DB, obj.ID, "request_id")
}

// Request is the resolver for the request field.
func (r *requestStatusResolver) Request(ctx context.Context, obj *model.RequestStatus) (*model.Request, error) {
	return findObjectByID[model.Request](obj.RequestID, r.Conf.DB, "Error finding request.")
}

// DataSource is the resolver for the dataSource field.
func (r *requestStatusResolver) DataSource(ctx context.Context, obj *model.RequestStatus) (*model.DataSource, error) {
	return findObjectByID[model.DataSource](obj.DataSourceID, r.Conf.DB, "Error finding data source.")
}

// QueryRecords is the resolver for the queryRecords field.
func (r *requestStatusResolver) QueryRecords(ctx context.Context, obj *model.RequestStatus) ([]*model.QueryRecord, error) {
	return findChildObjects[model.QueryRecord](r.Conf.DB, obj.ID, "query_record_id")
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
		"created_at desc",
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

// QueryRecord returns generated.QueryRecordResolver implementation.
func (r *Resolver) QueryRecord() generated.QueryRecordResolver { return &queryRecordResolver{r} }

// Request returns generated.RequestResolver implementation.
func (r *Resolver) Request() generated.RequestResolver { return &requestResolver{r} }

// RequestStatus returns generated.RequestStatusResolver implementation.
func (r *Resolver) RequestStatus() generated.RequestStatusResolver { return &requestStatusResolver{r} }

type primaryKeyValueResolver struct{ *Resolver }
type queryRecordResolver struct{ *Resolver }
type requestResolver struct{ *Resolver }
type requestStatusResolver struct{ *Resolver }
