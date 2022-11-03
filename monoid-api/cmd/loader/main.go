package main

package main

import (
	"log"
	"os"

	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow"
	"github.com/brist-ai/monoid/workflow/activity"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	conf := cmd.GetBaseConfig(true, []interface{}{
		model.Workspace{},
		model.Category{},
		model.DataSource{},
		model.Purpose{},
		model.SiloDefinition{},
		model.SiloSpecification{},
		model.Subject{},
	})
}
