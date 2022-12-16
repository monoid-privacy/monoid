package main

import (
	"log"
	"os"

	"github.com/monoid-privacy/monoid/cmd"
	mworker "github.com/monoid-privacy/monoid/cmd/worker/worker"
	"github.com/monoid-privacy/monoid/workflow"
	"github.com/rs/zerolog"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
	zerologadapter "logur.dev/adapter/zerolog"
	"logur.dev/logur"
)

func main() {
	conf := cmd.GetBaseConfig(nil)
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

	mworker.RegisterWorkerWorkflowActivities(
		w,
		mworker.DefaultActivites(&conf),
		mworker.DefaultWorkflows(&conf),
	)

	// Start listening to the Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("unable to start Worker", err)
	}
}
