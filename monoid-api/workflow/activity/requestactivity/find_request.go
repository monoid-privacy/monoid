package requestactivity

import "github.com/brist-ai/monoid/model"

type FindRequestArgs struct {
	RequestID string `json:"requestId"`
}

func (a *RequestActivity) FindDBRequestStatuses(args FindRequestArgs) ([]model.RequestStatus, error) {
	statuses := []model.RequestStatus{}

	if err := a.Conf.DB.Where(
		"request_id = ?",
		args.RequestID,
	).Find(&statuses).Error; err != nil {
		return nil, err
	}

	return statuses, nil
}
