package workflow

import (
	"time"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/workflow"
)

func (w *Workflow) ValidateDSWorkflow(ctx workflow.Context, dataSourceDef model.SiloDefinition) (monoidprotocol.MonoidValidateMessage, error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
	}

	logger := workflow.GetLogger(ctx)
	logger.Info("Hi")

	ctx = workflow.WithActivityOptions(ctx, options)
	res := monoidprotocol.MonoidValidateMessage{}

	ac := activity.Activity{}
	err := workflow.ExecuteActivity(ctx, ac.ValidateDataSiloDef, dataSourceDef).Get(ctx, &res)

	return res, err
}
