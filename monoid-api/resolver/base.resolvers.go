package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
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
func (r *workspaceResolver) Settings(ctx context.Context, obj *model.Workspace) (string, error) {
	panic(fmt.Errorf("not implemented: Settings - settings"))
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
