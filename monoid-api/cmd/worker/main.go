package main

import (
	"log"
	"os"

	"github.com/monoid-privacy/monoid/cmd"
	"github.com/monoid-privacy/monoid/workflow"
	"github.com/monoid-privacy/monoid/workflow/activity"
	"github.com/monoid-privacy/monoid/workflow/activity/requestactivity"
	"github.com/monoid-privacy/monoid/workflow/requestworkflow"
	"github.com/rs/zerolog"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
	zerologadapter "logur.dev/adapter/zerolog"
	"logur.dev/logur"
)

func main() {
	conf := cmd.GetBaseConfig(false, cmd.Models)
	defer conf.AnalyticsIngestor.Close()

	logger := logur.LoggerToKV(zerologadapter.New(zerolog.New(os.Stdout).Level(zerolog.InfoLevel)))

	// Create the client object just once per process
	c, err := client.Dial(client.Options{
		HostPort: os.Getenv("TEMPORAL"),
		Logger:   logger,
	})

	if err != nil {
		log.Fatalln("unable to create Temporal client", err)
	}

	defer c.Close()

	w := worker.New(c, workflow.DockerRunnerQueue, worker.Options{
		MaxConcurrentActivityExecutionSize:     5,
		MaxConcurrentWorkflowTaskExecutionSize: 5,
	})
	a := activity.Activity{
		Conf: &conf,
	}
	ra := requestactivity.RequestActivity{
		Conf: &conf,
	}

	mwf := workflow.Workflow{
		Conf: &conf,
	}

	rmwf := requestworkflow.RequestWorkflow{
		Conf: &conf,
	}

	w.RegisterActivity(a.ValidateDataSiloDef)
	w.RegisterActivity(a.DetectDataSources)
	w.RegisterActivity(a.FindOrCreateJob)
	w.RegisterActivity(a.UpdateJobStatus)

	// Request-related activities
	w.RegisterActivity(ra.UpdateRequestStatusActivity)
	w.RegisterActivity(ra.FindDBSilos)
	w.RegisterActivity(ra.ProcessRequestResults)
	w.RegisterActivity(ra.RequestStatusActivity)
	w.RegisterActivity(ra.StartSiloRequestActivity)
	w.RegisterActivity(ra.BatchUpdateRequestStatusActivity)

	w.RegisterWorkflow(mwf.ValidateDSWorkflow)
	w.RegisterWorkflow(mwf.DetectDSWorkflow)
	w.RegisterWorkflow(rmwf.ExecuteRequestWorkflow)
	w.RegisterWorkflow(rmwf.ExecuteSiloRequestWorkflow)

	// Start listening to the Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("unable to start Worker", err)
	}
}
