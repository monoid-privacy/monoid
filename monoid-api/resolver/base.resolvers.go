package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/model"
)

// CreateWorkspace is the resolver for the createWorkspace field.
func (r *mutationResolver) CreateWorkspace(ctx context.Context, input model.CreateWorkspaceInput) (*model.Workspace, error) {
	workspace := model.Workspace{
		ID:   uuid.NewString(),
		Name: input.Name,
	}

	workspaceSettings := model.WorkspaceSettings{
		SendNews:      true,
		AnonymizeData: false,
	}

	for _, s := range input.Settings {
		if s.Key == "email" {
			workspaceSettings.Email = s.Value
		}

		if s.Key == "anonymizeData" {
			if s.Value == "t" {
				workspaceSettings.AnonymizeData = true
			} else {
				workspaceSettings.AnonymizeData = false
			}
		}

		if s.Key == "sendNews" {
			if s.Value == "t" {
				workspaceSettings.SendNews = true
			} else {
				workspaceSettings.SendNews = false
			}
		}
	}

	if valid := model.ValidateEmail(workspaceSettings.Email); !valid {
		return nil, handleError(fmt.Errorf("invalid email %s", workspaceSettings.Email), "Invalid email.")
	}

	settingsJSON, err := json.Marshal(workspaceSettings)
	if err != nil {
		return nil, handleError(err, "Error saving workspace settings.")
	}

	workspace.Settings = settingsJSON

	if err := r.Conf.DB.Create(&workspace).Error; err != nil {
		return nil, err
	}

	data := map[string]interface{}{
		"sendNews":      workspaceSettings.SendNews,
		"anonymizeData": workspaceSettings.AnonymizeData,
		"workspaceId":   workspace.ID,
	}

	identifyData := map[string]interface{}{}

	if !workspaceSettings.AnonymizeData {
		data["email"] = workspaceSettings.Email
		identifyData["email"] = workspaceSettings.Email
	}

	r.Conf.AnalyticsIngestor.Identify(nil, identifyData)
	r.Conf.AnalyticsIngestor.Track("createWorkspace", nil, data)

	return &workspace, nil
}

// UpdateWorkspaceSettings is the resolver for the updateWorkspaceSettings field.
func (r *mutationResolver) UpdateWorkspaceSettings(ctx context.Context, input model.UpdateWorkspaceSettingsInput) (*model.Workspace, error) {
	workspace := model.Workspace{}
	if err := r.Conf.DB.Where("id = ?", input.WorkspaceID).First(&workspace).Error; err != nil {
		return nil, handleError(err, "Could not find workspace.")
	}

	settings := model.WorkspaceSettings{}
	if err := json.Unmarshal(workspace.Settings, &settings); err != nil {
		return nil, handleError(err, "Error getting workspace settings.")
	}

	emailUpdated := false

	for _, s := range input.Settings {
		if s.Key == "email" {
			if s.Value != settings.Email {
				emailUpdated = true
			}

			settings.Email = s.Value
		}

		if s.Key == "sendNews" {
			if s.Value == "t" {
				settings.SendNews = true
			} else {
				settings.SendNews = false
			}
		}
	}

	if valid := model.ValidateEmail(settings.Email); !valid {
		return nil, handleError(fmt.Errorf("invalid email %s", settings.Email), "Invalid email.")
	}

	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return nil, handleError(err, "Error saving settings.")
	}

	workspace.Settings = settingsJSON

	data := map[string]interface{}{
		"sendNews":    settings.SendNews,
		"workspaceId": workspace.ID,
	}

	identifyData := map[string]interface{}{}

	if !settings.AnonymizeData {
		data["email"] = settings.Email
		identifyData["email"] = settings.Email

		if emailUpdated {
			r.Conf.AnalyticsIngestor.Identify(nil, identifyData)
		}
	}

	r.Conf.AnalyticsIngestor.Track("updateWorkspace", nil, data)

	if err := r.Conf.DB.Updates(&workspace).Error; err != nil {
		return nil, handleError(err, "Error updating workspace.")
	}

	return &workspace, nil
}

// DeleteWorkspace is the resolver for the deleteWorkspace field.
func (r *mutationResolver) DeleteWorkspace(ctx context.Context, id *string) (*string, error) {
	workspace := &model.Workspace{}

	if err := r.Conf.DB.Where("id = ?", id).First(workspace).Error; err != nil {
		return nil, handleError(err, "Error finding workspace.")
	}

	if err := r.Conf.DB.Delete(workspace).Error; err != nil {
		return nil, handleError(err, "Error deleting workspace.")
	}

	data := map[string]interface{}{
		"action":      "delete",
		"workspaceId": workspace.ID,
	}

	r.Conf.AnalyticsIngestor.Track("workspaceAction", nil, data)

	return id, nil
}

// Workspaces is the resolver for the workspaces field.
func (r *queryResolver) Workspaces(ctx context.Context) ([]*model.Workspace, error) {
	return findAllObjects[model.Workspace](r.Conf.DB, "Error finding workspaces.")
}

// Workspace is the resolver for the workspace field.
func (r *queryResolver) Workspace(ctx context.Context, id string) (*model.Workspace, error) {
	return findObjectByID[model.Workspace](id, r.Conf.DB, "Error finding workspace.")
}

// Settings is the resolver for the settings field.
func (r *workspaceResolver) Settings(ctx context.Context, obj *model.Workspace) (map[string]interface{}, error) {
	res := map[string]interface{}{}
	if err := json.Unmarshal(obj.Settings, &res); err != nil {
		return nil, handleError(err, "Error getting settings")
	}

	return res, nil
}

// Categories is the resolver for the categories field.
func (r *workspaceResolver) Categories(ctx context.Context, obj *model.Workspace) ([]*model.Category, error) {
	res := []*model.Category{}
	if err := r.Conf.DB.Where("workspace_id = ?", obj.ID).Or(
		"workspace_id IS NULL",
	).Find(&res).Error; err != nil {
		return nil, handleError(err, "Could not find categories.")
	}

	return res, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

// Workspace returns generated.WorkspaceResolver implementation.
func (r *Resolver) Workspace() generated.WorkspaceResolver { return &workspaceResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type workspaceResolver struct{ *Resolver }
