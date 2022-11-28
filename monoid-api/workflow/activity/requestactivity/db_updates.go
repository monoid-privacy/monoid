package requestactivity

import (
	"context"

	"github.com/monoid-privacy/monoid/model"
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
	return a.Conf.DB.Model(&model.RequestStatus{}).Where(
		"id = ?",
		args.RequestStatusID,
	).Update(
		"status",
		args.Status,
	).Error
}

type BatchUpdateRequestStatusArgs struct {
	RequestID        string
	SiloDefinitionID string
	Status           model.RequestStatusType
}

func (a *RequestActivity) BatchUpdateRequestStatusActivity(
	ctx context.Context,
	args BatchUpdateRequestStatusArgs,
) error {
	return a.Conf.DB.Model(&model.RequestStatus{}).Where(
		"request_id = ?",
		args.RequestID,
	).Where(
		"data_source_id IN (?)", a.Conf.DB.Model(&model.DataSource{}).Select("id").Where(
			"silo_definition_id = ?", args.SiloDefinitionID,
		),
	).Update("status", args.Status).Error
}
