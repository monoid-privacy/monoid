package resolver

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow"
	"go.temporal.io/sdk/client"
)

type validateResult struct {
	success bool
	message string
}

func (r *Resolver) validateSiloDef(ctx context.Context, workflowID string, siloDefinition model.SiloDefinition) (*validateResult, error) {
	options := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: workflow.DockerRunnerQueue,
	}

	// Start the Workflow
	sf := workflow.Workflow{
		Conf: r.Conf,
	}

	we, err := r.Conf.TemporalClient.ExecuteWorkflow(ctx, options, sf.ValidateDSWorkflow, siloDefinition)
	if err != nil {
		return nil, err
	}

	// Get the results
	var res monoidprotocol.MonoidValidateMessage
	err = we.Get(ctx, &res)
	if err != nil {
		return nil, err
	}

	if res.Status == monoidprotocol.MonoidValidateMessageStatusFAILURE {
		msg := "An error occurred while validating connection information."

		if res.Message != nil {
			msg = *res.Message
		}

		return &validateResult{
			success: false,
			message: msg,
		}, nil
	}

	return &validateResult{
		success: true,
		message: "",
	}, nil
}
