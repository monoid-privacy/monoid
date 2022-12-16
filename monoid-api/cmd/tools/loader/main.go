package main

import (
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/monoid-privacy/monoid/cmd"
	"github.com/monoid-privacy/monoid/cmd/tools/loader/loader"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
)

func register(conf *config.BaseConfig) (model.OSSRegistration, error) {
	registration := model.OSSRegistration{}
	if err := conf.DB.First(&registration).Error; err != nil {
		registration.ID = uuid.NewString()

		if err := conf.DB.Create(&registration).Error; err != nil {
			return model.OSSRegistration{}, err
		}
	}

	conf.AnalyticsIngestor.Track("startup", &registration.ID, map[string]interface{}{})

	return registration, nil
}

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage ./loader [config directory]")
		return
	}

	_ = godotenv.Load()

	conf := cmd.GetBaseConfig(true, cmd.Models)
	defer conf.AnalyticsIngestor.Close()

	if _, err := register(&conf); err != nil {
		panic("Error creating OSS registration.")
	}

	loader.LoadSpecs(&conf, os.Args[1])
	loader.LoadCategories(&conf, os.Args[1])
}
