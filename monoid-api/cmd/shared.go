package cmd

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/brist-ai/monoid/analytics/ingestor"
	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func MigrateDb(db *gorm.DB, models []interface{}) {
	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			panic(err)
		}
	}
}

type DBInfo struct {
	User     string
	Password string
	TCPHost  string
	Port     string
	Name     string
}

var Models = []interface{}{
	model.Workspace{},
	model.Category{},
	model.DataSource{},
	model.Purpose{},
	model.SiloScanConfig{},
	model.SiloDefinition{},
	model.SiloSpecification{},
	model.Subject{},
	model.Property{},
	model.UserPrimaryKey{},
	model.Job{},
	model.DataDiscovery{},
	model.OSSRegistration{},
}

func InitDb(dbInfo DBInfo) *gorm.DB {
	var db *gorm.DB
	var err error

	dbUser := dbInfo.User
	dbPass := dbInfo.Password
	dbTcpHost := dbInfo.TCPHost
	dbPort := dbInfo.Port
	dbName := dbInfo.Name

	dbURI := ""

	if dbPort != "" {
		dbURI = fmt.Sprintf("host=%s user=%s password=%s port=%s database=%s", dbTcpHost, dbUser, dbPass, dbPort, dbName)
	} else {
		dbURI = fmt.Sprintf("host=%s user=%s password=%s database=%s", dbTcpHost, dbUser, dbPass, dbName)
	}

	log.Info().Msgf("Connecting to Postgres DB %s", dbURI)

	dbPool, dbConnErr := sql.Open("pgx", dbURI)
	if dbConnErr != nil {
		panic("Could not connect to DB.")
	}

	db, err = gorm.Open(postgres.New(postgres.Config{
		Conn: dbPool,
	}), &gorm.Config{})

	if err != nil {
		panic("Failed to connect database")
	}

	return db
}

func GetBaseConfig(runMigrations bool, models []interface{}) config.BaseConfig {
	err := godotenv.Load()
	if err != nil {
		log.Debug().Msg("No .env file found")
	}

	rand.Seed(time.Now().UTC().UnixNano())

	db := InitDb(DBInfo{
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASS"),
		TCPHost:  os.Getenv("DB_TCP_HOST"),
		Port:     os.Getenv("DB_PORT"),
		Name:     os.Getenv("DB_NAME"),
	})

	if runMigrations {
		MigrateDb(db, models)
	}

	// Set the encryption secret
	key, err := base64.StdEncoding.DecodeString(os.Getenv("ENCRYPTION_KEY"))

	if err != nil {
		panic(err)
	}

	model.SetEncryptionKey(key)

	reg := model.OSSRegistration{}
	if err := db.First(&reg).Error; err != nil {
		reg.ID = "temp_" + uuid.NewString()
	}

	conf := config.BaseConfig{
		DB:          db,
		TokenSecret: os.Getenv("TOKEN_SECRET"),
		ApiURL:      os.Getenv("API_URL"),
		WebURL:      os.Getenv("WEB_URL"),
		AnalyticsIngestor: ingestor.NewSegmentIngestor(
			os.Getenv("SEGMENT_KEY"),
			&reg.ID,
		),
	}

	return conf
}
