package requestworkflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type DataSourceRequestArgs struct {
	SiloDefinitionID string `json:"siloDefinitionId"`
	RequestID        string `json:"requestId"`
}

const pollTime = 1 * time.Hour

func (w *RequestWorkflow) ExecuteSiloRequestWorkflow(
	ctx workflow.Context,
	args DataSourceRequestArgs,
) (err error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	// cleanupCtx, _ := workflow.NewDisconnectedContext(ctx)
	ac := requestactivity.RequestActivity{}

	// defer func() {
	// 	newRequestStatus := model.RequestStatusTypeExecuted

	// 	if err != nil {
	// 		newRequestStatus = model.RequestStatusTypeFailed
	// 	}

	// 	if terr := workflow.ExecuteActivity(cleanupCtx, ac.UpdateRequestStatusActivity, requestactivity.UpdateRequestStatusArgs{
	// 		RequestStatusID: args.RequestStatusID,
	// 		Status:          newRequestStatus,
	// 	}).Get(cleanupCtx, nil); terr != nil {
	// 		return
	// 	}
	// }()

	reqStatus := requestactivity.RequestStatusResult{}

	if err := workflow.ExecuteActivity(ctx, ac.StartDataSourceRequestActivity, requestactivity.StartRequestArgs{
		SiloDefinitionID: args.SiloDefinitionID,
		RequestID:        args.RequestID,
	}).Get(ctx, &reqStatus); err != nil {
		return err
	}

	for _, res := range reqStatus.ResultItems {
		// TODO: Change these activities to be batch processed
		if res.Error != nil {
			if terr := workflow.ExecuteActivity(ctx, ac.UpdateRequestStatusActivity, requestactivity.UpdateRequestStatusArgs{
				RequestStatusID: res.RequestStatusID,
				Status:          model.RequestStatusTypeFailed,
			}).Get(ctx, nil); terr != nil {
				return
			}

			continue
		}

		if res.FullyComplete {
			if terr := workflow.ExecuteActivity(ctx, ac.UpdateRequestStatusActivity, requestactivity.UpdateRequestStatusArgs{
				RequestStatusID: res.RequestStatusID,
				Status:          model.RequestStatusTypeExecuted,
			}).Get(ctx, nil); terr != nil {
				return
			}

			continue
		}

		res2 := requestactivity.RequestStatusItem{
			FullyComplete: res.FullyComplete, RequestStatus: res.RequestStatus,
		}

		for res2.RequestStatus.RequestStatus ==
			monoidprotocol.MonoidRequestStatusRequestStatusPROGRESS {
			if err := workflow.ExecuteActivity(ctx, ac.RequestStatusActivity, requestactivity.DataSourceRequestStatusArgs{
				RequestStatusID: res.RequestStatusID,
			}).Get(ctx, &res2); err != nil {
				return err
			}

			if res2.FullyComplete {
				if terr := workflow.ExecuteActivity(ctx, ac.UpdateRequestStatusActivity, requestactivity.UpdateRequestStatusArgs{
					RequestStatusID: res.RequestStatusID,
					Status:          model.RequestStatusTypeExecuted,
				}).Get(ctx, nil); terr != nil {
					return
				}

				continue
			}

			workflow.Sleep(ctx, pollTime)
		}

		if err := workflow.ExecuteActivity(ctx, ac.ProcessRequestResults, requestactivity.ProcessRequestArgs{
			ProtocolRequestStatus: *res2.RequestStatus,
			RequestStatusID:       res.RequestStatusID,
		}).Get(ctx, nil); err != nil {
			return err
		}
	}

	return nil
}
