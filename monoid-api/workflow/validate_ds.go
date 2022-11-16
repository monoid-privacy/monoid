package workflow

import (
	"time"

	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type ValidateDSArgs struct {
	SiloSpecID string
	Config     []byte
}

func (w *Workflow) ValidateDSWorkflow(ctx workflow.Context, args ValidateDSArgs) (monoidprotocol.MonoidValidateMessage, error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 2,
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 1,
		},
	}

	ctx = workflow.WithActivityOptions(ctx, options)
	res := monoidprotocol.MonoidValidateMessage{}

	ac := activity.Activity{}
	err := workflow.ExecuteActivity(ctx, ac.ValidateDataSiloDef, args).Get(ctx, &res)

	return res, err
}
