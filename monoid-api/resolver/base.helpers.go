package resolver

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/twinj/uuid"
)

func (r *queryResolver) CreateWorkspace(ctx context.Context, workspace *model.Workspace) error {
	workspace.ID = uuid.NewV1().String()
	if err := r.Conf.DB.Create(&workspace).Error; err != nil {
		return err
	}

	return nil
}
