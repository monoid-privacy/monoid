package main

import (
	"log"
	"os"

	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/workflow"
	"github.com/brist-ai/monoid/workflow/activity"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"github.com/brist-ai/monoid/workflow/requestworkflow"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	conf := cmd.GetBaseConfig(false, cmd.Models)
	defer conf.AnalyticsIngestor.Close()

	// Create the client object just once per process
	c, err := client.Dial(client.Options{
		HostPort: os.Getenv("TEMPORAL"),
	})

	if err != nil {
		log.Fatalln("unable to create Temporal client", err)
	}

	defer c.Close()

	w := worker.New(c, workflow.DockerRunnerQueue, worker.Options{})
	a := activity.Activity{
		Conf: &conf,
	}
	ra := requestactivity.RequestActivity{
		Activity: a,
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
	w.RegisterActivity(ra.FindDBRequestStatuses)
	w.RegisterActivity(ra.ProcessRequestResults)
	w.RegisterActivity(ra.RequestStatusActivity)
	w.RegisterActivity(ra.StartDataSourceRequestActivity)

	w.RegisterWorkflow(mwf.ValidateDSWorkflow)
	w.RegisterWorkflow(mwf.DetectDSWorkflow)
	w.RegisterWorkflow(rmwf.ExecuteRequestWorkflow)
	w.RegisterWorkflow(rmwf.ExecuteDataSourceRequestWorkflow)

	// Start listening to the Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("unable to start Worker", err)
	}
}
