package requestworkflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type SiloRequestArgs struct {
	SiloDefinitionID string `json:"siloDefinitionId"`
	RequestID        string `json:"requestId"`
}

const pollTime = 1 * time.Hour

func updateRequest(ctx workflow.Context, requestStatusID string, status model.RequestStatusType) error {
	ac := requestactivity.RequestActivity{}

	err := workflow.ExecuteActivity(
		ctx,
		ac.UpdateRequestStatusActivity,
		requestactivity.UpdateRequestStatusArgs{
			RequestStatusID: requestStatusID,
			Status:          status,
		}).Get(ctx, nil)

	return err
}

func (w *RequestWorkflow) ExecuteSiloRequestWorkflow(
	ctx workflow.Context,
	args SiloRequestArgs,
) (err error) {
	logger := workflow.GetLogger(ctx)
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	ac := requestactivity.RequestActivity{}

	reqStatus := requestactivity.RequestStatusResult{}

	if err := workflow.ExecuteActivity(ctx, ac.StartDataSourceRequestActivity, requestactivity.StartRequestArgs{
		SiloDefinitionID: args.SiloDefinitionID,
		RequestID:        args.RequestID,
	}).Get(ctx, &reqStatus); err != nil {
		return err
	}

	processing := reqStatus.ResultItems
	for len(processing) > 0 {
		newProcessing := make([]requestactivity.RequestStatusItem, 0, len(processing))

		for _, res := range processing {
			if res.Error != nil {

				if terr := updateRequest(ctx, res.RequestStatusID, model.RequestStatusTypeFailed); terr != nil {
					logger.Error("Error updating request", terr)
				}

				continue
			}

			if res.FullyComplete {
				if terr := updateRequest(ctx, res.RequestStatusID, model.RequestStatusTypeExecuted); terr != nil {
					logger.Error("Error updating request", terr)
				}

				continue
			}

			switch res.RequestStatus.RequestStatus {
			case monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE:
				if err := workflow.ExecuteActivity(ctx, ac.ProcessRequestResults, requestactivity.ProcessRequestArgs{
					ProtocolRequestStatus: *res.RequestStatus,
					RequestStatusID:       res.RequestStatusID,
				}).Get(ctx, nil); err != nil {
					logger.Error("Error processing results", err)

					if terr := updateRequest(ctx, res.RequestStatusID, model.RequestStatusTypeFailed); terr != nil {
						logger.Error("Error updating request", terr)
						continue
					}

					continue
				}

				if terr := updateRequest(ctx, res.RequestStatusID, model.RequestStatusTypeExecuted); terr != nil {
					logger.Error("Error updating request", terr)
					continue
				}
			case monoidprotocol.MonoidRequestStatusRequestStatusFAILED:
				if terr := updateRequest(ctx, res.RequestStatusID, model.RequestStatusTypeFailed); terr != nil {
					logger.Error("Error updating request", terr)
					continue
				}
			case monoidprotocol.MonoidRequestStatusRequestStatusPROGRESS:
				newProcessing = append(newProcessing, res)
			}
		}

		if len(newProcessing) == 0 {
			break
		}

		// Sleep before getting the new statuses, so we aren't hitting apis too frequently.
		workflow.Sleep(ctx, pollTime)

		// Run another request to get the status, and process again.
		statusIDs := make([]string, 0, len(newProcessing))
		for _, r := range newProcessing {
			statusIDs = append(statusIDs, r.RequestStatusID)
		}

		res := requestactivity.RequestStatusResult{}

		if err := workflow.ExecuteActivity(ctx, ac.RequestStatusActivity, requestactivity.RequestStatusArgs{
			RequestStatusIDs: statusIDs,
		}).Get(ctx, &res); err != nil {
			return err
		}

		processing = res.ResultItems
	}

	return nil
}
