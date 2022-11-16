package workflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type ExecuteRequestArgs struct {
	RequestID   string
	JobID       string
	WorkspaceID string
}

func (w *Workflow) ExecuteRequestWorkflow(
	ctx workflow.Context,
	args ExecuteRequestArgs,
) error {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	ac := activity.Activity{}

	// Get or create (if this is scheduled) the job
	job := model.Job{}
	err := workflow.ExecuteActivity(ctx, ac.FindOrCreateJob, activity.JobInput{
		ID:          args.JobID,
		WorkspaceID: args.WorkspaceID,
		JobType:     model.JobTypeExecuteRequest,
		ResourceID:  args.RequestID,
		Status:      model.JobStatusRunning,
	}).Get(ctx, &job)

	if err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		return err
	}

	err = workflow.ExecuteActivity(ctx, ac.ExecuteRequest, args.RequestID).Get(ctx, nil)

	if err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		return err
	}

	err = workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
		ID:     job.ID,
		Status: model.JobStatusCompleted,
	}).Get(ctx, nil)

	return err
}
