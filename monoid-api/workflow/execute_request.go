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
	logger := workflow.GetLogger(ctx)

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

	request := model.Request{}
	if err := w.Conf.DB.Preload("PrimaryKeyValues").Preload("RequestStatuses").Where(
		"id = ?",
		args.RequestID,
	).First(&request).Error; err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		return err
	}

	futures := make([]workflow.Future, len(request.RequestStatuses))
	for i, r := range request.RequestStatuses {
		future := workflow.ExecuteActivity(ctx, ac.ExecuteRequestOnDataSource, r.ID)
		futures[i] = future
	}

	jobFailed := false

	for i, f := range futures {
		if err := f.Get(ctx, nil); err != nil {
			jobFailed = true
			logger.Error("error scheduling execute request on data source", map[string]interface{}{
				"dataSource": request.RequestStatuses[i].DataSourceID,
				"request":    request.RequestStatuses[i].RequestID,
			})
		}
	}

	if jobFailed {
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
