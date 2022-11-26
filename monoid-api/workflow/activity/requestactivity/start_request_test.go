package requestactivity

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/config"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"go.temporal.io/sdk/testsuite"
)

type startRequestTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	pgContainer testcontainers.Container
	env         *testsuite.TestActivityEnvironment
	ra          *RequestActivity
}

func (s *startRequestTestSuite) SetupSuite() {
	req := testcontainers.ContainerRequest{
		Image:        "postgres:latest",
		ExposedPorts: []string{"5432/tcp"},
		WaitingFor:   wait.ForListeningPort("5432/tcp"),
		AutoRemove:   true,
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "postgres",
		},
	}

	ctx := context.Background()

	postgres, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})

	s.pgContainer = postgres

	if err != nil {
		panic(err)
	}

	p, err := postgres.MappedPort(ctx, "5432")
	if err != nil {
		panic(err)
	}

	h, err := postgres.Host(ctx)
	if err != nil {
		panic(err)
	}

	psqlInfo := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		h, p.Port(), "postgres", "postgres", "postgres",
	)

	rawDB, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}

	_, err = rawDB.Exec("CREATE DATABASE monoidtest")
	if err != nil {
		rawDB.Close()
		panic(err)
	}

	rawDB.Close()

	fmt.Println("Successfully connected!")

	db := cmd.InitDb(cmd.DBInfo{
		User:     "postgres",
		Password: "postgres",
		TCPHost:  h,
		Port:     p.Port(),
		Name:     "monoidtest",
	})

	cmd.MigrateDb(db, cmd.Models)

	s.ra = &RequestActivity{
		Conf: &config.BaseConfig{DB: db},
	}
}

func (s *startRequestTestSuite) TeardownSuite() {
	s.pgContainer.Terminate(context.Background())
}

func (s *startRequestTestSuite) SetupTest() {
	s.env = s.NewTestActivityEnvironment()
	s.env.RegisterActivity(s.ra.StartDataSourceRequestActivity)
}

func (s *startRequestTestSuite) TestStartRequest() {
	val, err := s.env.ExecuteActivity(s.ra.StartDataSourceRequestActivity, StartRequestArgs{
		SiloDefinitionID: "test_silo",
		RequestID:        "test_request",
	})

	if !s.NoError(err) {
		return
	}

	res := RequestStatusResult{}
	if err := val.Get(&res); !s.NoError(err) {
		return
	}
}

func TestStartRequestSuite(t *testing.T) {
	suite.Run(t, &startRequestTestSuite{})
}
