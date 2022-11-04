package main

import (
	"fmt"
	"os"

	"github.com/brist-ai/monoid/specimport"
	"github.com/docker/docker/client"
	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

func main() {
	godotenv.Load()

	if len(os.Args) != 3 {
		fmt.Println("Usage: ./discovery [manifest_file] [out_file]")
		return
	}

	// Get the manifest spec
	fileName := os.Args[1]
	f, err := os.Open(fileName)

	if err != nil {
		panic(err)
	}

	defer f.Close()

	// Get the initial integrations from the spec
	integrations := []specimport.IntegrationManifestEntry{}
	if err := yaml.NewDecoder(f).Decode(&integrations); err != nil {
		panic(err)
	}

	dockerCli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	// Run the docker command to get the json schema for the silos
	specs := []*specimport.IntegrationFullSpecEntry{}
	for _, integration := range integrations {
		spec, err := specimport.GetFullSpec(&integration, dockerCli)
		if err != nil {
			fmt.Printf("Error parsing integration %s: %v\n", integration.Name, err)
			continue
		}

		specs = append(specs, spec)
	}

	// Write the enriched schema back.
	outfile, err := os.Create(os.Args[2])
	if err != nil {
		panic(err)
	}

	defer outfile.Close()

	err = yaml.NewEncoder(outfile).Encode(&specs)
	if err != nil {
		panic(err)
	}
}
