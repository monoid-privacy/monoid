package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/requests"
	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

// CreateUserPrimaryKey is the resolver for the createUserPrimaryKey field.
func (r *mutationResolver) CreateUserPrimaryKey(ctx context.Context, input model.CreateUserPrimaryKeyInput) (*model.UserPrimaryKey, error) {
	userPrimaryKey := model.UserPrimaryKey{
		ID:   uuid.NewString(),
		Name: input.Name,
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

// DeleteUserData is the resolver for the deleteUserData field.
func (r *mutationResolver) DeleteUserData(ctx context.Context, input model.DeleteUserDataInput) ([]*model.MonoidRecordResponse, error) {
	primaryKeyMap := make(requests.PrimaryKeyMap)
	for _, primaryKey := range input.PrimaryKeys {
		if primaryKey != nil {
			keyID := primaryKey.UserPrimaryKeyID
			primaryKeyMap[keyID] = primaryKey.Value
		}
	}

	var siloDefinitions []model.SiloDefinition

	if err := r.Conf.DB.Preload(clause.Associations).Preload("DataSources.Properties").Where("workspace_id = ?", input.WorkspaceID).Find(&siloDefinitions).Error; err != nil {
		return nil, handleError(err, "Error deleting user data.")
	}

	monoidRequestHandler := requests.NewMonoidRequestHandler()
	deletionRequest := requests.DeletionRequest{
		PrimaryKeyMap:   primaryKeyMap,
		SiloDefinitions: siloDefinitions,
	}

	records, err := monoidRequestHandler.HandleDeletion(deletionRequest)

	if err != nil {
		return nil, handleError(err, "Error deleting user data.")
	}

	recordResponses := MonoidRecordsToMonoidRecordResponses(*records)
	var recordResponsePointers []*model.MonoidRecordResponse
	for _, response := range recordResponses {
		recordResponsePointers = append(recordResponsePointers, &response)
	}
	return recordResponsePointers, nil
}

// QueryUserData is the resolver for the queryUserData field.
func (r *mutationResolver) QueryUserData(ctx context.Context, input model.QueryUserDataInput) ([]*model.MonoidRecordResponse, error) {
	primaryKeyMap := make(requests.PrimaryKeyMap)
	for _, primaryKey := range input.PrimaryKeys {
		if primaryKey != nil {
			keyID := primaryKey.UserPrimaryKeyID
			primaryKeyMap[keyID] = primaryKey.Value
		}
	}

	var siloDefinitions []model.SiloDefinition

	if err := r.Conf.DB.Preload(clause.Associations).Preload("DataSources.Properties").Where("workspace_id = ?", input.WorkspaceID).Find(&siloDefinitions).Error; err != nil {
		return nil, handleError(err, "Error deleting user data.")
	}

	monoidRequestHandler := requests.NewMonoidRequestHandler()
	queryRequest := requests.QueryRequest{
		PrimaryKeyMap:   primaryKeyMap,
		SiloDefinitions: siloDefinitions,
	}

	records, err := monoidRequestHandler.HandleQuery(queryRequest)

	if err != nil {
		return nil, handleError(err, "Error querying user data.")
	}

	recordResponses := MonoidRecordsToMonoidRecordResponses(*records)
	var recordResponsePointers []*model.MonoidRecordResponse
	for _, response := range recordResponses {
		recordResponsePointers = append(recordResponsePointers, &response)
	}
	return recordResponsePointers, nil
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *queryResolver) UserPrimaryKey(ctx context.Context, id string) (*model.UserPrimaryKey, error) {
	return findObjectByID[model.UserPrimaryKey](id, r.Conf.DB, "Error finding user primary key.")
}
