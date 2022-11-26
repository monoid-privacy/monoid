package requestactivity

import (
	"testing"

	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type processResultTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite

	env *testsuite.TestActivityEnvironment
	ra  *RequestActivity
}

func (s *processResultTestSuite) SetupTest() {
	s.env = s.NewTestActivityEnvironment()
}

func (s *processResultTestSuite) TestProcessResult() {
	d := monoidprotocol.MonoidRequestStatusDataTypeRECORDS
	s.env.ExecuteActivity(s.ra.ProcessRequestResults, ProcessRequestArgs{
		ProtocolRequestStatus: monoidprotocol.MonoidRequestStatus{
			RequestStatus: monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE,
			DataType:      &d,
			SchemaGroup:   "",
			SchemaName:    "test_schema",
		},
	})
}

func TestOrchestrateSuite(t *testing.T) {
	suite.Run(t, &processResultTestSuite{})
}
