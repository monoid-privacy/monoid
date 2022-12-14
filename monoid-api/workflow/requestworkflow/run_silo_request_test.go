package requestworkflow

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	"github.com/monoid-privacy/monoid/workflow/activity/requestactivity"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type siloRequestUnitTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	ra  *requestactivity.RequestActivity
	rw  *RequestWorkflow
	env *testsuite.TestWorkflowEnvironment
}

func (s *siloRequestUnitTestSuite) SetupTest() {
	s.ra = &requestactivity.RequestActivity{
		Conf: &config.BaseConfig{},
	}

	s.rw = &RequestWorkflow{
		Conf: &config.BaseConfig{},
	}
}

func (s *siloRequestUnitTestSuite) tabularSetup() {
	s.env = s.NewTestWorkflowEnvironment()

	s.env.RegisterActivity(s.ra.StartSiloRequestActivity)
	s.env.RegisterActivity(s.ra.RequestStatusActivity)
	s.env.RegisterActivity(s.ra.ProcessRequestResults)
	s.env.RegisterActivity(s.ra.UpdateRequestStatusActivity)
	s.env.RegisterWorkflow(s.rw.ExecuteSiloRequestWorkflow)
}

func (s *siloRequestUnitTestSuite) tabularAfter() {
	s.env.AssertExpectations(s.T())
}

func str(s string) *string {
	return &s
}

// TestSimpleSiloRequest verifies that a request that returns immediately
// works correctly.
func (s *siloRequestUnitTestSuite) TestSimpleSiloRequest() {
	type simpleTestArgs struct {
		status         monoidprotocol.MonoidRequestStatusRequestStatus
		result         model.RequestStatusType
		workflowResult model.FullRequestStatus
		fullyComplete  bool
		err            *requestactivity.RequestStatusError
		processErr     error
		name           string
	}

	for _, arg := range []simpleTestArgs{
		{
			status:         monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
			result:         model.RequestStatusTypeExecuted,
			workflowResult: model.FullRequestStatusExecuted,
			name:           "complete",
		},
		{
			status:         monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
			result:         model.RequestStatusTypeFailed,
			workflowResult: model.FullRequestStatusFailed,
			processErr:     fmt.Errorf("processing error"),
			name:           "process_err",
		},
		{
			status:         monoidprotocol.MonoidRequestStatusRequestStatusFAILED,
			result:         model.RequestStatusTypeFailed,
			workflowResult: model.FullRequestStatusFailed,
			name:           "failed",
		},
		{
			result:         model.RequestStatusTypeFailed,
			name:           "activity_error",
			workflowResult: model.FullRequestStatusFailed,
			err:            &requestactivity.RequestStatusError{Message: "activity error"},
		},
		{
			result:         model.RequestStatusTypeExecuted,
			workflowResult: model.FullRequestStatusExecuted,
			name:           "fully_complete",
			fullyComplete:  true,
		},
	} {
		s.Run(arg.name, func() {
			s.tabularSetup()
			defer s.tabularAfter()

			wfArgs := SiloRequestArgs{
				SiloDefinitionID: uuid.NewString(),
				RequestID:        uuid.NewString(),
			}

			dt := monoidprotocol.MonoidRequestStatusDataTypeRECORDS
			status := &monoidprotocol.MonoidRequestStatus{
				DataType:      &dt,
				RequestStatus: arg.status,
				SchemaGroup:   str("test_group"),
				SchemaName:    "test_name",
			}

			if arg.fullyComplete || arg.err != nil {
				status = nil
			}

			results := requestactivity.RequestStatusResult{
				ResultItems: []requestactivity.RequestStatusItem{{
					FullyComplete:   arg.fullyComplete,
					RequestStatus:   status,
					RequestStatusID: uuid.NewString(),
					Error:           arg.err,
				}},
			}

			s.env.OnActivity(s.ra.StartSiloRequestActivity, mock.Anything, requestactivity.StartRequestArgs{
				SiloDefinitionID: wfArgs.SiloDefinitionID,
				RequestID:        wfArgs.RequestID,
			}).Return(results, nil).Once()

			if arg.status == monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE {
				times := 1

				if arg.processErr != nil {
					// Retry logic
					times = 5
				}

				res := requestactivity.ProcessRequestResult{
					ResultItems: []requestactivity.ProcessRequestItem{{
						RequestStatusID: results.ResultItems[0].RequestStatusID,
					}},
				}

				if arg.processErr != nil {
					res = requestactivity.ProcessRequestResult{}
				}

				s.env.OnActivity(s.ra.ProcessRequestResults, mock.Anything, requestactivity.ProcessRequestArgs{
					ProtocolRequestStatus: []monoidprotocol.MonoidRequestStatus{*results.ResultItems[0].RequestStatus},
					RequestStatusIDs:      []string{results.ResultItems[0].RequestStatusID},
				}).Return(res, arg.processErr).Times(times)
			}

			s.env.OnActivity(s.ra.UpdateRequestStatusActivity, mock.Anything, requestactivity.UpdateRequestStatusArgs{
				RequestStatusID: results.ResultItems[0].RequestStatusID,
				Status:          arg.result,
			}).Return(nil).Once()

			s.env.ExecuteWorkflow(s.rw.ExecuteSiloRequestWorkflow, wfArgs)
			s.True(s.env.IsWorkflowCompleted())

			res := ExecuteSiloRequestResult{}
			if !s.NoError(s.env.GetWorkflowResult(&res)) {
				return
			}

			s.Equal(ExecuteSiloRequestResult{
				Status: arg.workflowResult,
			}, res)

			s.NoError(s.env.GetWorkflowError())
		})
	}
}

// TestDelayedSiloRequest verifies that a job that takes time to become complete
// runs appropriately.
func (s *siloRequestUnitTestSuite) TestDelayedSiloRequest() {
	s.tabularSetup()
	defer s.tabularAfter()

	wfArgs := SiloRequestArgs{
		SiloDefinitionID: uuid.NewString(),
		RequestID:        uuid.NewString(),
	}

	dt := monoidprotocol.MonoidRequestStatusDataTypeRECORDS
	results := requestactivity.RequestStatusResult{
		ResultItems: []requestactivity.RequestStatusItem{{
			FullyComplete: false,
			RequestStatus: &monoidprotocol.MonoidRequestStatus{
				DataType:      &dt,
				RequestStatus: monoidprotocol.MonoidRequestStatusRequestStatusPROGRESS,
				SchemaGroup:   str("test_group"),
				SchemaName:    "test_name",
			},
			RequestStatusID: uuid.NewString(),
		}},
	}

	s.env.OnActivity(s.ra.StartSiloRequestActivity, mock.Anything, requestactivity.StartRequestArgs{
		SiloDefinitionID: wfArgs.SiloDefinitionID,
		RequestID:        wfArgs.RequestID,
	}).Return(results, nil).Once()

	times := 0
	s.env.OnActivity(
		s.ra.RequestStatusActivity,
		mock.Anything,
		mock.MatchedBy(func(args requestactivity.RequestStatusArgs) bool {
			return reflect.DeepEqual(args, requestactivity.RequestStatusArgs{
				RequestStatusIDs: []string{results.ResultItems[0].RequestStatusID}})
		}),
	).Return(func(_ context.Context, args requestactivity.RequestStatusArgs) (requestactivity.RequestStatusResult, error) {
		if times >= 2 {
			results.ResultItems[0].RequestStatus.RequestStatus = monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE
		}

		times++
		return results, nil
	}).Times(3)

	completeStatus := *results.ResultItems[0].RequestStatus
	completeStatus.RequestStatus = monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE

	s.env.OnActivity(s.ra.ProcessRequestResults, mock.Anything, requestactivity.ProcessRequestArgs{
		ProtocolRequestStatus: []monoidprotocol.MonoidRequestStatus{completeStatus},
		RequestStatusIDs:      []string{results.ResultItems[0].RequestStatusID},
	}).Return(requestactivity.ProcessRequestResult{
		ResultItems: []requestactivity.ProcessRequestItem{{
			RequestStatusID: results.ResultItems[0].RequestStatusID,
		}},
	}, nil).Once()

	s.env.OnActivity(s.ra.UpdateRequestStatusActivity, mock.Anything, requestactivity.UpdateRequestStatusArgs{
		RequestStatusID: results.ResultItems[0].RequestStatusID,
		Status:          model.RequestStatusTypeExecuted,
	}).Return(nil).Once()

	s.env.ExecuteWorkflow(s.rw.ExecuteSiloRequestWorkflow, wfArgs)
	s.True(s.env.IsWorkflowCompleted())
	s.NoError(s.env.GetWorkflowError())
}

func TestSiloRequestSuite(t *testing.T) {
	suite.Run(t, &siloRequestUnitTestSuite{})
}
