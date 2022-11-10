package workflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

func (w *Workflow) DetectDSWorkflow(
	ctx workflow.Context,
	jobID string,
	dataSiloDef model.SiloDefinition,
) error {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	ac := activity.Activity{}
	err := workflow.ExecuteActivity(ctx, ac.FindOrCreateJob, activity.JobInput{
		ID:          jobID,
		WorkspaceID: dataSiloDef.WorkspaceID,
		JobType:     model.JobTypeDiscoverSources,
		ResourceID:  dataSiloDef.ID,
		Status:      model.JobStatusRunning,
	}).Get(ctx, nil)

	if err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     jobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		if err != nil {
			return err
		}

		return err
	}

	err = workflow.ExecuteActivity(ctx, ac.DetectDataSources, dataSiloDef).Get(ctx, nil)

	if err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     jobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		if err != nil {
			return err
		}

		return err
	}

	err = workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
		ID:     jobID,
		Status: model.JobStatusCompleted,
	}).Get(ctx, nil)

	return err
}
