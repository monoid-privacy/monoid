package requestworkflow

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/brist-ai/monoid/config"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/workflow/activity/requestactivity"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type SiloRequestUnitTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	ra  *requestactivity.RequestActivity
	rw  *RequestWorkflow
	env *testsuite.TestWorkflowEnvironment
}

func (s *SiloRequestUnitTestSuite) SetupTest() {
	s.ra = &requestactivity.RequestActivity{
		Conf: &config.BaseConfig{},
	}

	s.rw = &RequestWorkflow{
		Conf: &config.BaseConfig{},
	}
}

func (s *SiloRequestUnitTestSuite) tabularSetup() {
	s.env = s.NewTestWorkflowEnvironment()

	s.env.RegisterActivity(s.ra.StartDataSourceRequestActivity)
	s.env.RegisterActivity(s.ra.RequestStatusActivity)
	s.env.RegisterActivity(s.ra.ProcessRequestResults)
	s.env.RegisterActivity(s.ra.UpdateRequestStatusActivity)
	s.env.RegisterWorkflow(s.rw.ExecuteSiloRequestWorkflow)
}

func (s *SiloRequestUnitTestSuite) tabularAfter() {
	s.env.AssertExpectations(s.T())
}

// TestSimpleSiloRequest verifies that a request that returns immediately
// works correctly.
func (s *SiloRequestUnitTestSuite) TestSimpleSiloRequest() {
	type simpleTestArgs struct {
		status        monoidprotocol.MonoidRequestStatusRequestStatus
		result        model.RequestStatusType
		fullyComplete bool
		err           *requestactivity.RequestStatusError
		processErr    error
		name          string
	}

	for _, arg := range []simpleTestArgs{
		{
			status: monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
			result: model.RequestStatusTypeExecuted,
			name:   "complete",
		},
		{
			status:     monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
			result:     model.RequestStatusTypeFailed,
			processErr: fmt.Errorf("processing error"),
			name:       "process_err",
		},
		{
			status: monoidprotocol.MonoidRequestStatusRequestStatusFAILED,
			result: model.RequestStatusTypeFailed,
			name:   "failed",
		},
		{
			result: model.RequestStatusTypeFailed,
			name:   "activity_error",
			err:    &requestactivity.RequestStatusError{Message: "activity error"},
		},
		{
			result:        model.RequestStatusTypeExecuted,
			name:          "fully_complete",
			fullyComplete: true,
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
				SchemaGroup:   "test_group",
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

			s.env.OnActivity(s.ra.StartDataSourceRequestActivity, mock.Anything, requestactivity.StartRequestArgs{
				SiloDefinitionID: wfArgs.SiloDefinitionID,
				RequestID:        wfArgs.RequestID,
			}).Return(results, nil).Once()

			if arg.status == monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE {
				times := 1

				if arg.processErr != nil {
					// Retry logic
					times = 5
				}

				s.env.OnActivity(s.ra.ProcessRequestResults, mock.Anything, requestactivity.ProcessRequestArgs{
					ProtocolRequestStatus: *results.ResultItems[0].RequestStatus,
					RequestStatusID:       results.ResultItems[0].RequestStatusID,
				}).Return(arg.processErr).Times(times)
			}

			s.env.OnActivity(s.ra.UpdateRequestStatusActivity, mock.Anything, requestactivity.UpdateRequestStatusArgs{
				RequestStatusID: results.ResultItems[0].RequestStatusID,
				Status:          arg.result,
			}).Return(nil).Once()

			s.env.ExecuteWorkflow(s.rw.ExecuteSiloRequestWorkflow, wfArgs)
			s.True(s.env.IsWorkflowCompleted())
			s.NoError(s.env.GetWorkflowError())
		})
	}
}

// TestDelayedSiloRequest verifies that a job that takes time to become complete
// runs appropriately.
func (s *SiloRequestUnitTestSuite) TestDelayedSiloRequest() {
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
				SchemaGroup:   "test_group",
				SchemaName:    "test_name",
			},
			RequestStatusID: uuid.NewString(),
		}},
	}

	s.env.OnActivity(s.ra.StartDataSourceRequestActivity, mock.Anything, requestactivity.StartRequestArgs{
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
		ProtocolRequestStatus: completeStatus,
		RequestStatusID:       results.ResultItems[0].RequestStatusID,
	}).Return(nil).Once()

	s.env.OnActivity(s.ra.UpdateRequestStatusActivity, mock.Anything, requestactivity.UpdateRequestStatusArgs{
		RequestStatusID: results.ResultItems[0].RequestStatusID,
		Status:          model.RequestStatusTypeExecuted,
	}).Return(nil).Once()

	s.env.ExecuteWorkflow(s.rw.ExecuteSiloRequestWorkflow, wfArgs)
	s.True(s.env.IsWorkflowCompleted())
	s.NoError(s.env.GetWorkflowError())
}

func TestSiloRequestSuite(t *testing.T) {
	suite.Run(t, &SiloRequestUnitTestSuite{})
}
