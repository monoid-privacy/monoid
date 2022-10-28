package database

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
)

func (p *DBPersistence) Workspaces(ctx context.Context) ([]*model.Workspace, error) {
	workspaces := []*model.Workspace{}
	if err := p.DB.Find(&workspaces).Error; err != nil {
		return nil, err
	}

	return workspaces, nil
}

func (p *DBPersistence) Workspace(ctx context.Context, id string) (*model.Workspace, error) {
	workspace := model.Workspace{}
	if err := p.DB.Where("id = ?", id).First(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace, nil
}

func (p *DBPersistence) CreateWorkspace(ctx context.Context, workspace *model.Workspace) error {
	workspace.ID = uuid.New().String()
	if err := p.DB.Create(&workspace).Error; err != nil {
		return err
	}

	return nil
}
