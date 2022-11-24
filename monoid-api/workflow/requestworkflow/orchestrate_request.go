package requestworkflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type ExecuteRequestArgs struct {
	RequestID   string
	JobID       string
	WorkspaceID string
}

func failWorkflow(ctx workflow.Context, jobID string, err error) error {
	ac := activity.Activity{}

	if err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
		ID:     jobID,
		Status: model.JobStatusFailed,
	}).Get(ctx, nil); err != nil {
		return err
	}

	return err
}

func (w *RequestWorkflow) ExecuteRequestWorkflow(
	ctx workflow.Context,
	args ExecuteRequestArgs,
) error {
	logger := workflow.GetLogger(ctx)

	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 2,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	reqAc := requestactivity.RequestActivity{}

	statuses := []model.RequestStatus{}
	if err := workflow.ExecuteActivity(ctx, reqAc.FindDBRequestStatuses, requestactivity.FindRequestArgs{
		RequestID: args.RequestID,
	}).Get(ctx, &statuses); err != nil {
		return failWorkflow(ctx, args.JobID, err)
	}

	ctx = workflow.WithChildOptions(ctx, workflow.ChildWorkflowOptions{})
	futures := make([]workflow.ChildWorkflowFuture, len(statuses))

	for i, r := range statuses {
		futures[i] = workflow.ExecuteChildWorkflow(ctx, w.ExecuteDataSourceRequestWorkflow, DataSourceRequestArgs{
			RequestStatusID: r.ID,
		})
	}

	for i, f := range futures {
		if err := f.Get(ctx, nil); err != nil {
			logger.Error("error scheduling execute request on data source", map[string]interface{}{
				"dataSource": statuses[i].DataSourceID,
				"request":    statuses[i].RequestID,
			}, err)
		}
	}

	return nil
}
