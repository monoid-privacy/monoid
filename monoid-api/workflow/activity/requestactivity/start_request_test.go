package requestactivity

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/brist-ai/monoid/cmd"
	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/mocks"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/golang/mock/gomock"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"go.temporal.io/sdk/testsuite"
	"gorm.io/gorm"
)

const testEncKey = "Tc7ILcxCi68Xk7646IrNBYmbMzbWNU+s94fnZMJ1zzk="

type startRequestTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	pgContainer testcontainers.Container
	env         *testsuite.TestActivityEnvironment
	ra          *RequestActivity
	db          *gorm.DB
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

	s.db = db
}

func (s *startRequestTestSuite) TeardownSuite() {
	s.pgContainer.Terminate(context.Background())
}

func (s *startRequestTestSuite) SetupTest() {
	s.ra = &RequestActivity{
		Conf: &config.BaseConfig{
			DB: s.db,
		},
	}
	s.env = s.NewTestActivityEnvironment()
	s.env.RegisterActivity(s.ra.StartDataSourceRequestActivity)
}

// func str(s string) *string {
// 	return &s
// }

type seedRes struct {
	config  map[string]interface{}
	request model.Request
	silo    model.SiloDefinition
}

type seedParams struct {
	numSources int
}

func (s *startRequestTestSuite) teardownDB() {
	models := []interface{}{
		model.PrimaryKeyValue{},
		model.RequestStatus{},
		model.Request{},
		model.Property{},
		model.DataSource{},
		model.SiloDefinition{},
		model.UserPrimaryKey{},
		model.SiloSpecification{},
		model.Workspace{},
	}

	s.db.Transaction(func(tx *gorm.DB) error {
		for _, m := range models {
			s.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&m)
		}

		return nil
	})
}

func (s *startRequestTestSuite) seedDB(params seedParams) (seedRes, error) {
	key, err := base64.StdEncoding.DecodeString(testEncKey)

	if err != nil {
		panic(err)
	}

	model.SetEncryptionKey(key)

	workspace := model.Workspace{
		ID: uuid.NewString(),
	}

	siloSpecification := model.SiloSpecification{
		ID:          uuid.NewString(),
		DockerImage: "test_image",
		DockerTag:   "0.0.1",
	}

	config := map[string]interface{}{
		"test": "test_config",
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		panic(err)
	}

	pk := model.UserPrimaryKey{
		ID:            uuid.NewString(),
		WorkspaceID:   workspace.ID,
		Name:          "Test",
		APIIdentifier: "test",
	}

	sources := make([]*model.DataSource, params.numSources)

	for i := 0; i < params.numSources; i++ {
		sources[i] = &model.DataSource{
			ID:    uuid.NewString(),
			Name:  uuid.NewString(),
			Group: nil,
			Properties: []*model.Property{{
				Name:             "0",
				ID:               uuid.NewString(),
				UserPrimaryKeyID: &pk.ID,
			}},
		}
	}

	silo := model.SiloDefinition{
		ID:                  "test_silo",
		WorkspaceID:         workspace.ID,
		Config:              model.SecretString(configJSON),
		SiloSpecificationID: siloSpecification.ID,
		DataSources:         sources,
	}

	request := model.Request{
		ID:          "test_request",
		WorkspaceID: workspace.ID,
		Type:        model.UserDataRequestTypeQuery,
		RequestStatuses: []model.RequestStatus{
			{
				ID:           uuid.NewString(),
				DataSourceID: silo.DataSources[0].ID,
				Status:       model.RequestStatusTypeCreated,
			},
		},
		PrimaryKeyValues: []model.PrimaryKeyValue{{
			ID:               uuid.NewString(),
			UserPrimaryKeyID: pk.ID,
			Value:            "test_val",
		}},
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&workspace).Error; err != nil {
			return err
		}

		if err := tx.Create(&siloSpecification).Error; err != nil {
			return err
		}

		if err := tx.Create(&pk).Error; err != nil {
			return err
		}

		if err := tx.Create(&silo).Error; err != nil {
			return err
		}

		if err := tx.Create(&request).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return seedRes{}, err
	}

	return seedRes{
		config:  config,
		request: request,
		silo:    silo,
	}, nil
}

func (s *startRequestTestSuite) TestStartRequest() {
	type testConfig struct {
		name string
	}

	for _, cfg := range []testConfig{{name: "basic"}} {
		s.Run(cfg.name, func() {
			seedData, err := s.seedDB(seedParams{numSources: 1})
			if !s.NoError(err) {
				return
			}

			defer s.teardownDB()

			ctrl := gomock.NewController(s.T())
			defer ctrl.Finish()

			protocol := mocks.NewMockMonoidProtocol(ctrl)

			protocol.EXPECT().InitConn(gomock.Any()).Return(nil)

			protocol.EXPECT().AttachLogs(gomock.Any()).Return(
				make(chan monoidprotocol.MonoidLogMessage), nil)

			schema := monoidprotocol.MonoidSchemaJsonSchema{
				"$schema": "http://json-schema.org/draft-07/schema#",
				"type":    "object",
				"properties": map[string]interface{}{
					"0": map[string]interface{}{
						"type": "string",
					},
				},
			}

			schemaName := seedData.silo.DataSources[0].Name

			protocol.EXPECT().Schema(gomock.Any(), gomock.Eq(seedData.config)).Return(
				&monoidprotocol.MonoidSchemasMessage{
					Schemas: []monoidprotocol.MonoidSchema{{
						Group:      nil,
						Name:       schemaName,
						JsonSchema: schema,
					}},
				}, nil,
			)

			results := make(chan monoidprotocol.MonoidRequestResult)
			handle := monoidprotocol.MonoidRequestHandle{
				Data: monoidprotocol.MonoidRequestHandleData{
					"test": uuid.NewString(),
				},
				RequestType: monoidprotocol.MonoidRequestHandleRequestTypeQUERY,
				SchemaName:  schemaName,
			}

			dt := monoidprotocol.MonoidRequestStatusDataTypeRECORDS

			status := monoidprotocol.MonoidRequestStatus{
				SchemaName:    schemaName,
				RequestStatus: monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
				DataType:      &dt,
			}

			go func() {
				results <- monoidprotocol.MonoidRequestResult{
					Handle: handle,
					Status: status,
				}

				close(results)
			}()

			protocol.EXPECT().Query(
				gomock.Any(), gomock.Eq(seedData.config), gomock.Eq(
					monoidprotocol.MonoidQuery{
						Identifiers: []monoidprotocol.MonoidQueryIdentifier{{
							Identifier:      "0",
							IdentifierQuery: "test_val",
							JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema),
							SchemaName:      schemaName,
						}},
					},
				)).Return(results, nil)

			protocol.EXPECT().Teardown(gomock.Any()).Return(nil)

			factory := mocks.NewMockMonoidProtocolFactory(ctrl)
			factory.EXPECT().NewMonoidProtocol(
				gomock.Eq("test_image"), gomock.Eq("0.0.1"), gomock.Any(),
			).Return(protocol, nil)

			s.ra.Conf.ProtocolFactory = factory

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

			s.Equal(res.ResultItems, []RequestStatusItem{{
				FullyComplete:   false,
				RequestStatus:   &status,
				SchemaName:      schemaName,
				RequestStatusID: seedData.request.RequestStatuses[0].ID,
			}})

			dbStatus := model.RequestStatus{}
			if !s.NoError(s.db.Where(
				"id = ?", seedData.request.RequestStatuses[0].ID,
			).First(&dbStatus).Error) {
				return
			}

			resHandle := monoidprotocol.MonoidRequestHandle{}
			if !s.NoError(json.Unmarshal(
				[]byte(dbStatus.RequestHandle), &resHandle)) {
				return
			}

			s.Equal(resHandle, handle)
		})
	}
}

func TestStartRequestSuite(t *testing.T) {
	suite.Run(t, &startRequestTestSuite{})
}
