package cmd

import (
	"context"
	"database/sql"
	"encoding/base64"
	"fmt"
	"math/rand"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/monoid-privacy/monoid/analytics/ingestor"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/filestore/gcloudstore"
	"github.com/monoid-privacy/monoid/filestore/localstore"
	"google.golang.org/api/option"

	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol/docker"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func MigrateDBHelper(db *gorm.DB, models []interface{}) {
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
	model.SiloDefinition{},
	model.SiloSpecification{},
	model.Property{},
	model.UserPrimaryKey{},
	model.Job{},
	model.Request{},
	model.RequestStatus{},
	model.PrimaryKeyValue{},
	model.DataDiscovery{},
	model.OSSRegistration{},
	model.QueryResult{},
	model.DownloadableFile{},
}

func MigrateOSS(db *gorm.DB) {
	MigrateDBHelper(db, Models)
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

func GetBaseConfig(migrator func(db *gorm.DB)) config.BaseConfig {
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

	if migrator != nil {
		migrator(db)
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

	tempStore := os.Getenv("TEMP_STORE_PATH")
	if tempStore == "" {
		tempStore = os.TempDir()
	}

	conf := config.BaseConfig{
		DB:              db,
		WebURL:          os.Getenv("WEB_URL"),
		TempStorePath:   tempStore,
		ProtocolFactory: &docker.DockerProtocolFactory{},
		AnalyticsIngestor: ingestor.NewSegmentIngestor(
			os.Getenv("SEGMENT_KEY"),
			&reg.ID,
		),
	}

	switch os.Getenv("STORAGE_TYPE") {
	case "google_cloud":
		cli, err := storage.NewClient(context.Background(), option.WithCredentialsFile(
			os.Getenv("GOOGLE_CLOUD_JSON"),
		))

		if err != nil {
			panic(err)
		}

		conf.FileStore = gcloudstore.NewGoogleCloudStore(
			cli,
			os.Getenv("GCS_BUCKET"),
		)
	default:
		conf.FileStore = localstore.NewLocalFileStore(os.Getenv("FILESTORE_PATH"))
	}

	return conf
}
