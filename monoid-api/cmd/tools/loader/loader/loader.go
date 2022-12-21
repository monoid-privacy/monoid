package loader

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/specimport"
	"github.com/rs/zerolog/log"
	"gopkg.in/yaml.v3"
)

func LoadSpecs(conf *config.BaseConfig, configPath string) {
	f, err := os.Open(filepath.Join(configPath, "integration-spec.yaml"))
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

		var logoUrl *string = nil

		if s.Logo != "" {
			logoUrl = &s.Logo
		}

		newSiloSpec := model.SiloSpecification{
			ID:          s.ID,
			Name:        s.Name,
			LogoURL:     logoUrl,
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

func LoadCategories(conf *config.BaseConfig, configPath string) {
	f, err := os.Open(filepath.Join(configPath, "data-categories.yaml"))
	if err != nil {
		panic(err)
	}

	categories := []model.Category{}
	if err := yaml.NewDecoder(f).Decode(&categories); err != nil {
		panic(err)
	}

	for _, yamlCat := range categories {
		cat := model.Category{}
		if err := conf.DB.Where("id = ?", yamlCat.ID).First(&cat).Error; err != nil {
			if err := conf.DB.Create(&yamlCat).Error; err != nil {
				log.Err(err).Msgf("Error creating category: %s", yamlCat.Name)
			}

			fmt.Printf("Successfully created category %s (%s)\n", cat.ID, cat.Name)

			continue
		}

		if err := conf.DB.Updates(&yamlCat).Error; err != nil {
			log.Err(err).Msgf("Error updating category: %s", yamlCat.Name)
			continue
		}
	}
}
