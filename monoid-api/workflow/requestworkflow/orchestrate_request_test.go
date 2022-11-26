package requestworkflow

import (
	"fmt"
	"testing"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"github.com/pborman/uuid"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type orchestrateUnitTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	ra  *requestactivity.RequestActivity
	rw  *RequestWorkflow
	env *testsuite.TestWorkflowEnvironment
}

func (s *orchestrateUnitTestSuite) SetupTest() {
	s.ra = &requestactivity.RequestActivity{
		Conf: &config.BaseConfig{},
	}

	s.rw = &RequestWorkflow{
		Conf: &config.BaseConfig{},
	}
}

func (s *orchestrateUnitTestSuite) tabularSetup() {
	s.env = s.NewTestWorkflowEnvironment()

	s.env.RegisterActivity(s.ra.FindDBSilos)
	s.env.RegisterWorkflow(s.rw.ExecuteRequestWorkflow)
	s.env.RegisterWorkflow(s.rw.ExecuteSiloRequestWorkflow)
}

func (s *orchestrateUnitTestSuite) tabularAfter() {
	s.env.AssertExpectations(s.T())
}

func (s *orchestrateUnitTestSuite) TestSimpleOrchestrate() {
	for _, numRequests := range []int{1, 10, 500} {
		s.Run(fmt.Sprintf("Simple %d", numRequests), func() {
			s.tabularSetup()

			requestArgs := ExecuteRequestArgs{
				RequestID:   "test_request_id",
				JobID:       "test_job_id",
				WorkspaceID: "test_workspace_id",
			}

			silos := make([]model.SiloDefinition, numRequests)
			siloMap := map[string]model.SiloDefinition{}

			for i := 0; i < numRequests; i++ {
				silos[i] = model.SiloDefinition{
					ID: uuid.New(),
				}

				siloMap[silos[i].ID] = silos[i]
			}

			s.env.OnActivity(s.ra.FindDBSilos, mock.Anything).Return(
				silos, nil,
			)

			s.env.OnWorkflow(
				s.rw.ExecuteSiloRequestWorkflow, mock.Anything, mock.MatchedBy(func(args SiloRequestArgs) bool {
					if _, ok := siloMap[args.SiloDefinitionID]; !ok {
						return false
					}

					return args.RequestID == requestArgs.RequestID
				}),
			).Return(nil).Times(numRequests)

			s.env.ExecuteWorkflow(s.rw.ExecuteRequestWorkflow, requestArgs)

			s.True(s.env.IsWorkflowCompleted())
			s.NoError(s.env.GetWorkflowError())

			s.tabularAfter()
		})
	}
}

func TestOrchestrateSuite(t *testing.T) {
	suite.Run(t, &orchestrateUnitTestSuite{})
}
