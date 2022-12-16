package worker

import (
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/workflow"
	"github.com/monoid-privacy/monoid/workflow/activity"
	"github.com/monoid-privacy/monoid/workflow/activity/requestactivity"
	"github.com/monoid-privacy/monoid/workflow/requestworkflow"
	"go.temporal.io/sdk/worker"
)

func DefaultActivites(conf *config.BaseConfig) []interface{} {
	a := activity.Activity{
		Conf: conf,
	}

	ra := requestactivity.RequestActivity{
		Conf: conf,
	}

	return []interface{}{
		a.ValidateDataSiloDef,
		a.DetectDataSources,
		a.FindOrCreateJob,
		a.UpdateJobStatus,
		ra.UpdateRequestStatusActivity,
		ra.FindDBSilos,
		ra.ProcessRequestResults,
		ra.RequestStatusActivity,
		ra.StartSiloRequestActivity,
		ra.BatchUpdateRequestStatusActivity,
	}
}

func DefaultWorkflows(conf *config.BaseConfig) []interface{} {
	mwf := workflow.Workflow{
		Conf: conf,
	}

	rmwf := requestworkflow.RequestWorkflow{
		Conf: conf,
	}

	return []interface{}{
		mwf.ValidateDSWorkflow,
		mwf.DetectDSWorkflow,
		rmwf.ExecuteRequestWorkflow,
		rmwf.ExecuteSiloRequestWorkflow,
	}
}

func RegisterWorkerWorkflowActivities(
	w worker.Worker,
	activities []interface{},
	workflows []interface{},
) {

	for _, a := range activities {
		w.RegisterActivity(a)
	}

	for _, wf := range workflows {
		w.RegisterWorkflow(wf)
	}
}
