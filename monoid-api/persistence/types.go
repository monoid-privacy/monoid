package persistence

import (
	"context"

	"github.com/brist-ai/monoid/model"
)

type Persistence interface {
	Workspaces(ctx context.Context) ([]*model.Workspace, error)
	Workspace(ctx context.Context, id string) (*model.Workspace, error)
	CreateWorkspace(ctx context.Context, workspace *model.Workspace) error
}
