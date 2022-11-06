package workflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

func (w *Workflow) DetectDSWorkflow(ctx workflow.Context, dataSourceDef model.SiloDefinition) error {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 5,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	ac := activity.Activity{}
	err := workflow.ExecuteActivity(ctx, ac.DetectDataSources, dataSourceDef).Get(ctx, nil)

	return err
}
