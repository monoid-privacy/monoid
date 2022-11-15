package workflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity"
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
		JobType:     model.JobTypeDiscoverSources,
		ResourceID:  args.SiloDefID,
		Status:      model.JobStatusRunning,
	}).Get(ctx, &job)

	w.Conf.AnalyticsIngestor.Track("job", nil, map[string]interface{}{
		"jobId":   job.ID,
		"jobType": "detectDataSources",
		"siloId":  args.SiloDefID,
		"action":  "started",
	})

	if err != nil {
		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		if err != nil {
			return err
		}

		return err
	}

	numDiscoveries := 0

	// Run the detection activity
	err = workflow.ExecuteActivity(ctx, ac.DetectDataSources, activity.DetectDSArgs{
		SiloID: args.SiloDefID,
	}).Get(ctx, &numDiscoveries)

	if err != nil {
		w.Conf.AnalyticsIngestor.Track("job", nil, map[string]interface{}{
			"jobId":   job.ID,
			"jobType": "detectDataSources",
			"siloId":  args.SiloDefID,
			"action":  "failed",
		})

		err := workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
			ID:     args.JobID,
			Status: model.JobStatusFailed,
		}).Get(ctx, nil)

		if err != nil {
			return err
		}

		return err
	}

	w.Conf.AnalyticsIngestor.Track("job", nil, map[string]interface{}{
		"jobId":          job.ID,
		"jobType":        "detectDataSources",
		"siloId":         args.SiloDefID,
		"action":         "completed",
		"numDiscoveries": numDiscoveries,
	})

	err = workflow.ExecuteActivity(ctx, ac.UpdateJobStatus, activity.JobStatusInput{
		ID:     job.ID,
		Status: model.JobStatusCompleted,
	}).Get(ctx, nil)

	return err
}
