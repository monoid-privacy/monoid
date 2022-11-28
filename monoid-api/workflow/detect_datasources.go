package workflow

import (
	"time"

	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/workflow/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type DetectDSArgs struct {
	SiloDefID   string
	WorkspaceID string
	JobID       string
}

func (w *Workflow) DetectDSWorkflow(
	ctx workflow.Context,
	args DetectDSArgs,
) (err error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
		HeartbeatTimeout: 2 * time.Second,
	}

	cleanupOptions := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 1,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 2,
		},
	}

	cleanupCtx, _ := workflow.NewDisconnectedContext(
		workflow.WithActivityOptions(ctx, cleanupOptions),
	)

	ctx = workflow.WithActivityOptions(ctx, options)
	ac := activity.Activity{}

	defer func() {
		status := model.JobStatusCompleted

		if err != nil {
			status = model.JobStatusFailed
		}

		terr := workflow.ExecuteActivity(cleanupCtx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: status,
		}).Get(ctx, nil)

		if terr != nil && err == nil {
			err = terr
		}
	}()

	// Get or create (if this is scheduled) the job
	job := model.Job{}
	err = workflow.ExecuteActivity(ctx, ac.FindOrCreateJob, activity.JobInput{
		ID:          args.JobID,
		WorkspaceID: args.WorkspaceID,
		JobType:     model.JobTypeDiscoverSources,
		ResourceID:  args.SiloDefID,
		Status:      model.JobStatusRunning,
	}).Get(ctx, &job)

	if err != nil {
		return err
	}

	numDiscoveries := 0

	// Run the detection activity
	err = workflow.ExecuteActivity(ctx, ac.DetectDataSources, activity.DetectDSArgs{
		SiloID:        args.SiloDefID,
		LogObjectName: job.LogObject,
	}).Get(ctx, &numDiscoveries)

	if err != nil {
		return err
	}

	return nil
}
