package requestactivity

import (
	"context"

	"github.com/brist-ai/monoid/model"
)

type UpdateRequestStatusArgs struct {
	RequestStatusID string
	Status          model.RequestStatusType
}

func (a *RequestActivity) UpdateRequestStatusActivity(
	ctx context.Context,
	args UpdateRequestStatusArgs,
) error {
	return a.Conf.DB.Model(&model.RequestStatus{}).Where(
		"id = ?",
		args.RequestStatusID,
	).Update(
		"status",
		args.Status,
	).Error
}
