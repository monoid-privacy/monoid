package cmd

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
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
	model.SiloDefinition{},
	model.SiloSpecification{},
	model.Subject{},
	model.Property{},
	model.Job{},
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

func encryptionKey(keyFile string) ([]byte, error) {
	dat, err := os.ReadFile(keyFile)
	if err != nil {
		return nil, err
	}

	strDat := strings.Trim(string(dat), " \n")
	key, err := base64.StdEncoding.DecodeString(strDat)
	if err != nil {
		return nil, err
	}

	return key, nil
}

func GetBaseConfig(runMigrations bool, models []interface{}) config.BaseConfig {
	err := godotenv.Load()
	if err != nil {
		panic(err)
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
	tokenSecretFile := os.Getenv("DB_ENCRYPTION_KEY")
	key, err := encryptionKey(tokenSecretFile)

	if err != nil {
		panic(err)
	}

	model.SetEncryptionKey(key)

	conf := config.BaseConfig{
		DB:          db,
		TokenSecret: os.Getenv("TOKEN_SECRET"),
		ApiURL:      os.Getenv("API_URL"),
		WebURL:      os.Getenv("WEB_URL"),
	}

	return conf
}
