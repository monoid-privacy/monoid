package cloud

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/cloud/auth"
	"github.com/brist-ai/monoid/model"
	"gorm.io/gorm"
)

func (p *CloudDBPersistence) checkWorkspaceAccess(ctx context.Context, id string) bool {
	res := auth.ForContext(ctx)
	if !res.Authorized {
		return false
	}

	cnt := int64(0)
	p.DB.Table("user_workspaces").Where(
		"user_id = ?",
		res.User.ID,
	).Where(
		"workspace_id = ?",
		id,
	).Count(&cnt)

	if cnt > 0 {
		return true
	}

	return false
}

func (p *CloudDBPersistence) Workspaces(ctx context.Context) ([]*model.Workspace, error) {
	res := auth.ForContext(ctx)
	if !res.Authorized {
		return nil, fmt.Errorf("must be logged in")
	}

	workspaces := []*model.Workspace{}
	if err := p.DB.Model(&res.User).Association("Workspaces").Find(&workspaces); err != nil {
		return nil, err
	}

	return workspaces, nil
}

func (p *CloudDBPersistence) Workspace(ctx context.Context, id string) (*model.Workspace, error) {
	if !p.checkWorkspaceAccess(ctx, id) {
		return nil, fmt.Errorf("workspace not found")
	}

	return p.standardPersistence().Workspace(ctx, id)
}

func (p *CloudDBPersistence) CreateWorkspace(ctx context.Context, workspace *model.Workspace) error {
	res := auth.ForContext(ctx)
	if !res.Authorized {
		return fmt.Errorf("must be logged in to create a workspace")
	}

	if err := p.DB.Transaction(func(tx *gorm.DB) error {
		if err := p.stdPersistenceDB(tx).CreateWorkspace(ctx, workspace); err != nil {
			return err
		}

		tx.Model(&res.User).Association("Workspaces").Append(workspace)

		return nil
	}); err != nil {
		return nil
	}

	return nil
}
