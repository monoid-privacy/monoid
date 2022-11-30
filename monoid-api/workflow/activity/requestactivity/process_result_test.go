package requestactivity

import (
	"context"
	"encoding/base64"
	"testing"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"go.temporal.io/sdk/testsuite"
	"gorm.io/gorm"
)

type processResultSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	pgContainer testcontainers.Container
	env         *testsuite.TestActivityEnvironment
	ra          *RequestActivity
	db          *gorm.DB
}

func (s *processResultSuite) SetupSuite() {
	container, db, err := setupDB()
	if err != nil {
		panic(err)
	}

	s.db = db
	s.pgContainer = container
}

func (s *processResultSuite) TeardownSuite() {
	s.pgContainer.Terminate(context.Background())
}

func (s *processResultSuite) SetupTest() {
	s.ra = &RequestActivity{
		Conf: &config.BaseConfig{
			DB: s.db,
		},
	}
	s.env = s.NewTestActivityEnvironment()
	s.env.RegisterActivity(s.ra.ProcessRequestResults)
}

func (s *processResultSuite) teardownDB() {
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

type processResultSeedRes struct {
	config map[string]interface{}
	// request model.Request
	// silo    model.SiloDefinition
}

type processResultSeedParams struct {
	// numSources int
	// group      *string
	// missingPK  bool
}

func (s *processResultSuite) seedDB(params processResultSeedParams) (processResultSeedRes, error) {
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

	// configJSON, err := json.Marshal(config)
	// if err != nil {
	// 	panic(err)
	// }

	// pk := model.UserPrimaryKey{
	// 	ID:            uuid.NewString(),
	// 	WorkspaceID:   workspace.ID,
	// 	Name:          "Test",
	// 	APIIdentifier: "test",
	// }

	// sources := make([]*model.DataSource, params.numSources)
	// statuses := make([]model.RequestStatus, params.numSources)

	// for i := 0; i < params.numSources; i++ {
	// 	pk := &pk.ID
	// 	if params.missingPK {
	// 		pk = nil
	// 	}

	// 	sources[i] = &model.DataSource{
	// 		ID:    uuid.NewString(),
	// 		Name:  uuid.NewString(),
	// 		Group: params.group,
	// 		Properties: []*model.Property{{
	// 			Name:             "0",
	// 			ID:               uuid.NewString(),
	// 			UserPrimaryKeyID: pk,
	// 		}, {
	// 			Name: "1",
	// 			ID:   uuid.NewString(),
	// 		}},
	// 	}

	// 	statuses[i] = model.RequestStatus{
	// 		ID:           uuid.NewString(),
	// 		DataSourceID: sources[i].ID,
	// 		Status:       model.RequestStatusTypeCreated,
	// 	}
	// }

	// silo := model.SiloDefinition{
	// 	ID:                  "test_silo",
	// 	WorkspaceID:         workspace.ID,
	// 	Config:              model.SecretString(configJSON),
	// 	SiloSpecificationID: siloSpecification.ID,
	// 	DataSources:         sources,
	// }

	// request := model.Request{
	// 	ID:              "test_request",
	// 	WorkspaceID:     workspace.ID,
	// 	Type:            model.UserDataRequestTypeQuery,
	// 	RequestStatuses: statuses,
	// 	PrimaryKeyValues: []model.PrimaryKeyValue{{
	// 		ID:               uuid.NewString(),
	// 		UserPrimaryKeyID: pk.ID,
	// 		Value:            "test_val",
	// 	}},
	// }

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&workspace).Error; err != nil {
			return err
		}

		if err := tx.Create(&siloSpecification).Error; err != nil {
			return err
		}

		// 	if err := tx.Create(&pk).Error; err != nil {
		// 		return err
		// 	}

		// 	if err := tx.Create(&silo).Error; err != nil {
		// 		return err
		// 	}

		// 	if err := tx.Create(&request).Error; err != nil {
		// 		return err
		// 	}

		return nil
	}); err != nil {
		return processResultSeedRes{}, err
	}

	return processResultSeedRes{
		config: config,
	}, nil
}

func (s *processResultSuite) TestStartRequest() {
	// type testConfig struct {
	// 	name string
	// }

	// for _, cfg := range []testConfig{
	// 	{name: "basic"},
	// } {
	// 	s.Run(cfg.name, func() {
	// 		seedData, err := s.seedDB(processResultSeedParams{})
	// 		if !s.NoError(err) {
	// 			return
	// 		}

	// 		defer s.teardownDB()

	// 		ctrl := gomock.NewController(s.T())
	// 		defer ctrl.Finish()

	// 		protocol := mocks.NewMockMonoidProtocol(ctrl)

	// 		protocol.EXPECT().InitConn(gomock.Any()).Return(nil)

	// 		protocol.EXPECT().AttachLogs(gomock.Any()).Return(
	// 			make(chan monoidprotocol.MonoidLogMessage), nil)

	// 		val, err := s.env.ExecuteActivity(s.ra.ProcessRequestResults, ProcessRequestArgs{
	// 			ProtocolRequestStatus: "test_silo",
	// 			RequestStatusID:       "test_request",
	// 		})

	// 		if !s.NoError(err) {
	// 			return
	// 		}
	// 	})
	// }
}

func TestProcessResultSuite(t *testing.T) {
	suite.Run(t, &startRequestTestSuite{})
}
