package requestworkflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"go.temporal.io/sdk/workflow"
)

type DataSourceRequestArgs struct {
	RequestStatusID string `json:"requestStatusId"`
}

const pollTime = 1 * time.Hour

func (w *RequestWorkflow) ExecuteDataSourceRequestWorkflow(
	ctx workflow.Context,
	args DataSourceRequestArgs,
) (err error) {
	cleanupCtx, _ := workflow.NewDisconnectedContext(ctx)
	ac := requestactivity.RequestActivity{}

	defer func() {
		newRequestStatus := model.RequestStatusTypeExecuted

		if err != nil {
			newRequestStatus = model.RequestStatusTypeFailed
		}

		if terr := workflow.ExecuteActivity(cleanupCtx, ac.UpdateRequestStatusActivity, requestactivity.UpdateRequestStatusArgs{
			RequestStatusID: args.RequestStatusID,
			Status:          newRequestStatus,
		}); terr != nil {
			return
		}

		return
	}()

	reqStatus := requestactivity.RequestStatusResult{}

	if err := workflow.ExecuteActivity(ctx, ac.StartDataSourceRequestActivity, requestactivity.StartRequestArgs{
		RequestStatusID: args.RequestStatusID,
	}).Get(ctx, &reqStatus); err != nil {
		return err
	}

	if reqStatus.FullyComplete {
		return nil
	}

	for reqStatus.RequestStatus.RequestStatus ==
		monoidprotocol.MonoidRequestStatusRequestStatusPROGRESS {
		if err := workflow.ExecuteActivity(ctx, ac.RequestStatusActivity, requestactivity.StartRequestArgs{
			RequestStatusID: args.RequestStatusID,
		}).Get(ctx, &reqStatus); err != nil {
			return err
		}

		if reqStatus.FullyComplete {
			return nil
		}

		workflow.Sleep(ctx, pollTime)
	}

	if err := workflow.ExecuteActivity(ctx, ac.ProcessRequestResults, requestactivity.ProcessRequestArgs{
		ProtocolRequestStatus: reqStatus.RequestStatus,
		RequestStatusID:       args.RequestStatusID,
	}).Get(ctx, nil); err != nil {
		return err
	}

	return nil
}
