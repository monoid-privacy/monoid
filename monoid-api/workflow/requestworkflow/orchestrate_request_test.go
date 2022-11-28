package requestworkflow

import (
	"fmt"
	"testing"

	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/workflow/activity"
	"github.com/monoid-privacy/monoid/workflow/activity/requestactivity"
	"github.com/pborman/uuid"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
	"go.temporal.io/sdk/workflow"
)

type orchestrateUnitTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	ac  *activity.Activity
	ra  *requestactivity.RequestActivity
	rw  *RequestWorkflow
	env *testsuite.TestWorkflowEnvironment
}

func (s *orchestrateUnitTestSuite) SetupTest() {
	s.ra = &requestactivity.RequestActivity{
		Conf: &config.BaseConfig{},
	}

	s.ac = &activity.Activity{}

	s.rw = &RequestWorkflow{
		Conf: &config.BaseConfig{},
	}
}

func (s *orchestrateUnitTestSuite) tabularSetup() {
	s.env = s.NewTestWorkflowEnvironment()

	s.env.RegisterActivity(s.ra.FindDBSilos)
	s.env.RegisterActivity(s.ac.UpdateJobStatus)
	s.env.RegisterWorkflow(s.rw.ExecuteRequestWorkflow)
	s.env.RegisterWorkflow(s.rw.ExecuteSiloRequestWorkflow)
}

func (s *orchestrateUnitTestSuite) tabularAfter() {
	s.env.AssertExpectations(s.T())
}

func (s *orchestrateUnitTestSuite) TestSimpleOrchestrate() {
	type testArgs struct {
		name            string
		numRequests     int
		resJobStatus    model.JobStatus
		workflowResults []ExecuteSiloRequestResult
	}

	for _, arg := range []testArgs{{
		name:            "normal_1",
		numRequests:     1,
		resJobStatus:    model.JobStatusCompleted,
		workflowResults: []ExecuteSiloRequestResult{{Status: model.FullRequestStatusExecuted}},
	}, {
		name:            "normal_10",
		numRequests:     10,
		resJobStatus:    model.JobStatusCompleted,
		workflowResults: []ExecuteSiloRequestResult{{Status: model.FullRequestStatusExecuted}},
	}, {
		name:            "normal_500",
		numRequests:     500,
		resJobStatus:    model.JobStatusCompleted,
		workflowResults: []ExecuteSiloRequestResult{{Status: model.FullRequestStatusExecuted}},
	}, {
		name:         "partial_fail",
		numRequests:  10,
		resJobStatus: model.JobStatusPartialFailed,
		workflowResults: []ExecuteSiloRequestResult{
			{Status: model.FullRequestStatusExecuted},
			{Status: model.FullRequestStatusFailed},
		},
	}} {
		s.Run(fmt.Sprintf("Simple %s", arg.name), func() {
			s.tabularSetup()

			requestArgs := ExecuteRequestArgs{
				RequestID:   "test_request_id",
				JobID:       "test_job_id",
				WorkspaceID: "test_workspace_id",
			}

			silos := make([]model.SiloDefinition, arg.numRequests)
			siloMap := map[string]model.SiloDefinition{}

			for i := 0; i < arg.numRequests; i++ {
				silos[i] = model.SiloDefinition{
					ID: uuid.New(),
				}

				siloMap[silos[i].ID] = silos[i]
			}

			s.env.OnActivity(s.ac.UpdateJobStatus, mock.Anything, activity.JobStatusInput{
				ID:     "test_job_id",
				Status: arg.resJobStatus,
			}).Return(nil).Times(1)

			s.env.OnActivity(s.ra.FindDBSilos, mock.Anything).Return(
				silos, nil,
			)

			n := 0
			s.env.OnWorkflow(
				s.rw.ExecuteSiloRequestWorkflow, mock.Anything, mock.MatchedBy(func(args SiloRequestArgs) bool {
					if _, ok := siloMap[args.SiloDefinitionID]; !ok {
						return false
					}

					return args.RequestID == requestArgs.RequestID
				}),
			).Return(func(ctx workflow.Context, args SiloRequestArgs) (ExecuteSiloRequestResult, error) {
				n++
				return arg.workflowResults[n%len(arg.workflowResults)], nil
			}).Times(arg.numRequests)

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
