package requestactivity

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"testing"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/mocks"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/golang/mock/gomock"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"go.temporal.io/sdk/testsuite"
	"gorm.io/gorm"
)

type startRequestTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	pgContainer testcontainers.Container
	env         *testsuite.TestActivityEnvironment
	ra          *RequestActivity
	db          *gorm.DB
}

func (s *startRequestTestSuite) SetupSuite() {
	container, db, err := setupDB()
	if err != nil {
		panic(err)
	}

	s.db = db
	s.pgContainer = container
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

func str(s string) *string {
	return &s
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

type seedRes struct {
	config  map[string]interface{}
	request model.Request
	silo    model.SiloDefinition
}

type seedParams struct {
	numSources int
	group      *string
	missingPK  bool
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
	statuses := make([]model.RequestStatus, params.numSources)

	for i := 0; i < params.numSources; i++ {
		pk := &pk.ID
		if params.missingPK {
			pk = nil
		}

		sources[i] = &model.DataSource{
			ID:    uuid.NewString(),
			Name:  uuid.NewString(),
			Group: params.group,
			Properties: []*model.Property{{
				Name:             "0",
				ID:               uuid.NewString(),
				UserPrimaryKeyID: pk,
			}, {
				Name: "1",
				ID:   uuid.NewString(),
			}},
		}

		statuses[i] = model.RequestStatus{
			ID:           uuid.NewString(),
			DataSourceID: sources[i].ID,
			Status:       model.RequestStatusTypeCreated,
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
		ID:              "test_request",
		WorkspaceID:     workspace.ID,
		Type:            model.UserDataRequestTypeQuery,
		RequestStatuses: statuses,
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
		name          string
		group         *string
		numSources    int
		missingSchema bool
		missingPK     bool
	}

	for _, cfg := range []testConfig{
		{name: "basic", numSources: 1},
		{name: "group", group: str("group"), numSources: 1},
		{name: "multi_source", numSources: 5},
		{name: "missing_schema", numSources: 2, missingSchema: true},
		{name: "missing_pk", numSources: 2, missingPK: true},
	} {
		s.Run(cfg.name, func() {
			seedData, err := s.seedDB(seedParams{
				numSources: cfg.numSources,
				group:      cfg.group,
				missingPK:  cfg.missingPK,
			})
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
					"1": map[string]interface{}{
						"type": "string",
					},
				},
			}

			dataSources := seedData.silo.DataSources
			if cfg.missingSchema {
				dataSources = dataSources[:len(dataSources)-1]
			}

			schemas := make([]monoidprotocol.MonoidSchema, len(dataSources))

			for i, ds := range dataSources {
				schemas[i] = monoidprotocol.MonoidSchema{
					Group:      ds.Group,
					Name:       ds.Name,
					JsonSchema: schema,
				}
			}

			protocol.EXPECT().Schema(gomock.Any(), gomock.Eq(seedData.config)).Return(
				&monoidprotocol.MonoidSchemasMessage{
					Schemas: schemas,
				}, nil,
			)

			resultsArr := make([]monoidprotocol.MonoidRequestResult, len(seedData.silo.DataSources))
			for i, r := range seedData.silo.DataSources {
				handle := monoidprotocol.MonoidRequestHandle{
					Data: monoidprotocol.MonoidRequestHandleData{
						"test": uuid.NewString(),
					},
					RequestType: monoidprotocol.MonoidRequestHandleRequestTypeQUERY,
					SchemaName:  r.Name,
					SchemaGroup: r.Group,
				}

				dt := monoidprotocol.MonoidRequestStatusDataTypeRECORDS

				status := monoidprotocol.MonoidRequestStatus{
					SchemaName:    r.Name,
					SchemaGroup:   r.Group,
					RequestStatus: monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
					DataType:      &dt,
				}

				resultsArr[i] = monoidprotocol.MonoidRequestResult{
					Handle: handle,
					Status: status,
				}
			}

			if !cfg.missingPK {
				results := make(chan monoidprotocol.MonoidRequestResult)

				go func() {
					for _, r := range resultsArr {
						results <- r
					}

					close(results)
				}()

				identifiers := make([]monoidprotocol.MonoidQueryIdentifier, len(dataSources))
				for i, r := range dataSources {
					identifiers[i] = monoidprotocol.MonoidQueryIdentifier{
						Identifier:      "0",
						IdentifierQuery: "test_val",
						JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schema),
						SchemaName:      r.Name,
						SchemaGroup:     r.Group,
					}
				}

				protocol.EXPECT().Query(
					gomock.Any(), gomock.Eq(seedData.config), gomock.Eq(
						monoidprotocol.MonoidQuery{
							Identifiers: identifiers,
						},
					)).Return(results, nil)
			}

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

			statusItems := make([]RequestStatusItem, len(seedData.request.RequestStatuses))

			for i, rs := range seedData.request.RequestStatuses {
				if cfg.missingSchema && i == len(seedData.request.RequestStatuses)-1 {
					statusItems[i] = RequestStatusItem{
						RequestStatusID: rs.ID,
						Error:           &RequestStatusError{Message: "error finding schema"},
					}

					continue
				}

				if cfg.missingPK {
					statusItems[i] = RequestStatusItem{
						RequestStatusID: rs.ID,
						SchemaName:      seedData.silo.DataSources[i].Name,
						SchemaGroup:     seedData.silo.DataSources[i].Group,
						FullyComplete:   true,
					}

					continue
				}

				st := new(monoidprotocol.MonoidRequestStatus)
				*st = resultsArr[i].Status

				statusItems[i] = RequestStatusItem{
					FullyComplete:   false,
					RequestStatus:   st,
					SchemaName:      seedData.silo.DataSources[i].Name,
					SchemaGroup:     seedData.silo.DataSources[i].Group,
					RequestStatusID: rs.ID,
				}

				dbStatus := model.RequestStatus{}
				if !s.NoError(s.db.Where(
					"id = ?", rs.ID,
				).First(&dbStatus).Error) {
					continue
				}

				resHandle := monoidprotocol.MonoidRequestHandle{}
				if !s.NoError(json.Unmarshal(
					[]byte(dbStatus.RequestHandle), &resHandle)) {
					return
				}

				s.Equal(resHandle, resultsArr[i].Handle)
			}

			s.ElementsMatch(statusItems, res.ResultItems)
		})
	}
}

func TestStartRequestSuite(t *testing.T) {
	suite.Run(t, &startRequestTestSuite{})
}
