package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"

	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
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

// CreateUserDataRequest is the resolver for the createUserDataRequest field.
func (r *mutationResolver) CreateUserDataRequest(ctx context.Context, input *model.UserDataRequestInput) (*model.Request, error) {
	if input.Type != model.Delete && input.Type != model.Query {
		return nil, handleError(errors.New("request type is not 'delete' or 'query'"), "Error creating user data request.")
	}
	request := model.Request{
		ID:          uuid.NewString(),
		WorkspaceID: input.WorkspaceID,
		Type:        input.Type,
	}

	if err := r.Conf.DB.Create(&request).Error; err != nil {
		return nil, handleError(err, "Error creating user data request.")
	}

	for _, primaryKey := range input.PrimaryKeys {
		primaryKeyValue := model.PrimaryKeyValue{
			ID:               uuid.NewString(),
			UserPrimaryKeyID: primaryKey.UserPrimaryKeyID,
			Value:            primaryKey.Value,
			RequestID:        request.ID,
		}

		if err := r.Conf.DB.Create(&primaryKeyValue).Error; err != nil {
			return nil, handleError(err, "Error creating user data request.")
		}
	}

	type ID struct {
		ID string
	}

	siloDefinitionIDs := []ID{}
	dataSourceIDs := []ID{}

	// TODO: Do this properly with a join
	if err := r.Conf.DB.Model(model.DataSource{}).Where("workspace_id = ?", input.WorkspaceID).Find(&siloDefinitionIDs).Error; err != nil {
		return nil, handleError(err, "Error creating user data request.")
	}

	siloDefinitionIDStrings := []string{}
	for _, id := range siloDefinitionIDs {
		siloDefinitionIDStrings = append(siloDefinitionIDStrings, id.ID)
	}

	if err := r.Conf.DB.Model(model.DataSource{}).Where("silo_definition_id IN", siloDefinitionIDStrings).Find(&dataSourceIDs).Error; err != nil {
		return nil, handleError(err, "Error creating user data request.")
	}

	for _, id := range dataSourceIDs {
		requestStatus := model.RequestStatus{
			ID:           uuid.NewString(),
			RequestID:    request.ID,
			DataSourceID: id.ID,
			Status:       model.Created,
		}

		if err := r.Conf.DB.Create(&requestStatus).Error; err != nil {
			return nil, handleError(err, "Error creating user data request.")
		}
	}

	return &request, nil
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *queryResolver) UserPrimaryKey(ctx context.Context, id string) (*model.UserPrimaryKey, error) {
	return findObjectByID[model.UserPrimaryKey](id, r.Conf.DB, "Error finding user primary key.")
}

// Request is the resolver for the request field.
func (r *queryResolver) Request(ctx context.Context, id string) (*model.Request, error) {
	return findObjectByID[model.Request](id, r.Conf.DB, "Error finding request.")
}
