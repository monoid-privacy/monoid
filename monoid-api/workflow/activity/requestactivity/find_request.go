package requestactivity

import "github.com/monoid-privacy/monoid/model"

type FindRequestArgs struct {
	WorkspaceID string `json:"workspaceId"`
}

func (a *RequestActivity) FindDBSilos(args FindRequestArgs) ([]model.SiloDefinition, error) {
	defs := []model.SiloDefinition{}

	if err := a.Conf.DB.Where(
		"workspace_id = ?",
		args.WorkspaceID,
	).Find(&defs).Error; err != nil {
		return nil, err
	}

	return defs, nil
}
