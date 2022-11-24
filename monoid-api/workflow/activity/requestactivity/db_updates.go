package requestactivity

import (
	"context"

	"github.com/brist-ai/monoid/model"
)

type UpdateRequestStatusArgs struct {
	RequestStatusID string
	Status          model.RequestStatusType
}

// UpdateRequestStatusActivity updates the request status in the DB
func (a *RequestActivity) UpdateRequestStatusActivity(
	ctx context.Context,
	args UpdateRequestStatusArgs,
) error {
	return a.Conf.DB.Debug().Model(&model.RequestStatus{}).Where(
		"id = ?",
		args.RequestStatusID,
	).Update(
		"status",
		args.Status,
	).Error
}
