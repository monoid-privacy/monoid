package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/specimport"
	"gopkg.in/yaml.v3"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage ./loader [spec_file]")
		return
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

	f, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}

	manifestSpecs := []specimport.IntegrationFullSpecEntry{}
	if err := yaml.NewDecoder(f).Decode(&manifestSpecs); err != nil {
		panic(err)
	}

	for _, s := range manifestSpecs {
		schema, err := json.Marshal(s.Spec)
		if err != nil {
			fmt.Printf("Error registering %s: %v\n", s.Name, err)
		}

		schemaStr := string(schema)

		newSiloSpec := model.SiloSpecification{
			ID:          s.ID,
			Name:        s.Name,
			DockerImage: s.DockerImage,
			DockerTag:   s.DockerTag,
			Schema:      &schemaStr,
		}

		siloSpec := model.SiloSpecification{}
		if err := conf.DB.Where("id = ?", s.ID).First(&siloSpec).Error; err != nil {
			if err := conf.DB.Create(&newSiloSpec).Error; err != nil {
				fmt.Printf("Error registering %s: %v\n", s.Name, err)
				break
			}
		} else {
			if err := conf.DB.Updates(&newSiloSpec).Error; err != nil {
				fmt.Printf("Error registering %s: %v\n", s.Name, err)
				break
			}
		}

		fmt.Printf(
			"Successfully registered %s (%s:%s)\n",
			newSiloSpec.Name,
			newSiloSpec.DockerImage,
			newSiloSpec.DockerTag,
		)
	}
}
