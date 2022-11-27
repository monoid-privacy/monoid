import {
  gql, useQuery, useMutation, useApolloClient, ApolloError,
} from '@apollo/client';
import React, { useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';
import AlertRegion from '../../../../components/AlertRegion';
import PageHeader from '../../../../components/PageHeader';
import Spinner from '../../../../components/Spinner';
import Tabs from '../../../../components/Tabs';
import Button from '../../../../components/Button';
import { Request, Job } from '../../../../lib/models';
import PrimaryKeyValues from './components/PrimaryKeyValues';
import RequestStatuses from './components/RequestStatuses';
import ToastContext from '../../../../contexts/ToastContext';
import Badge from '../../../../components/Badge';

const EXECUTE_REQUEST = gql`
  mutation ExecuteRequest($id: ID!, $workspaceId: ID!) {
    executeUserDataRequest(requestId: $id, workspaceId: $workspaceId) {
      id
      status
      jobType
    }
  }
`;

const RUNNING_EXECUTE_REQUEST_JOBS = gql`
  query RunningDiscoverJobs($resourceId: ID!) {
    jobs(resourceId: $resourceId, jobType: "execute_request", status: [RUNNING, QUEUED]) {
      id
      jobType
      status
    }
  }
`;

const GET_REQUEST_METADATA = gql`
  query GetRequestMetadata($id: ID!) {
      request(id: $id) {
        id
        type
      }
  }
`;

function ScanRegion(props: {
  requestId: string,
  children: React.ReactNode,
  onScanStatusChange?: (status: 'COMPLETED' | 'STARTED') => void,
}) {
  const { requestId, children, onScanStatusChange } = props;

  const {
    data,
    previousData,
    loading,
    error,
  } = useQuery<{ jobs: Job[] }>(RUNNING_EXECUTE_REQUEST_JOBS, {
    variables: {
      resourceId: requestId,
    },
    pollInterval: 5000,
  });

  useEffect(() => {
    if (!onScanStatusChange || !previousData) {
      return;
    }

    if (previousData?.jobs.length === 0 && data?.jobs.length !== 0) {
      onScanStatusChange('STARTED');
    }

    if (previousData?.jobs.length !== 0 && data?.jobs.length === 0) {
      onScanStatusChange('COMPLETED');
    }
  }, [data, previousData]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle={error.message} />
    );
  }

  if (data!.jobs.length === 0) {
    return (
      <div>
        {children}
      </div>
    );
  }

  return (
    <Button disabled>
      <div className="flex items-center">
        <div className="mr-1"> Request Execution In Progress </div>
        <Spinner size="sm" color="white" />
      </div>
    </Button>
  );
}

ScanRegion.defaultProps = {
  onScanStatusChange: () => { },
};

export default function RequestPage(
  props: {
    tab: 'request_statuses' | 'primary_key_values'
  },
) {
  const { tab } = props;
  const [executeReq, executeReqRes] = useMutation<{ executeUserDataRequest: Job }>(EXECUTE_REQUEST);
  const navigate = useNavigate();
  const client = useApolloClient();
  const toastCtx = useContext(ToastContext);
  const { requestId, id } = useParams<{ requestId: string, id: string }>();
  const { data, loading, error } = useQuery<{
    request: Request
  }>(GET_REQUEST_METADATA, {
    variables: {
      id: requestId,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion
        alertTitle="Error"
      >
        {error.message}
      </AlertRegion>
    );
  }

  const request = data?.request;

  return (
    <>
      <PageHeader
        title={request?.id}
        subtitle={(
          <Badge>
            {request?.type === 'QUERY' ? 'Query' : 'Delete'}
          </Badge>
        )}
        actionItem={(
          <Button onClick={() => {
            executeReq({
              variables: {
                id: requestId,
                workspaceId: id,
              },
            }).then(({ data: resData }) => {
              client.writeQuery({
                query: RUNNING_EXECUTE_REQUEST_JOBS,
                data: {
                  jobs: [resData!.executeUserDataRequest],
                },
                variables: {
                  resourceId: requestId,
                },
              });
            }).catch((err: ApolloError) => {
              toastCtx.showToast({
                variant: 'danger',
                title: 'Error',
                message: err.message,
                icon: XCircleIcon,
              });
            });
          }}
          >
            {executeReqRes.loading ? <Spinner color="white" size="sm" /> : 'Execute Request'}
          </Button>
        )}
      />
      <Tabs
        tabs={[
          {
            tabName: 'User Identifiers',
            tabKey: 'primary_key_values',
            tabBody: <PrimaryKeyValues />,
          },
          {
            tabName: 'Request Statuses',
            tabKey: 'request_statuses',
            tabBody: <RequestStatuses />,
          },
        ]}
        current={tab}
        setCurrent={(c) => {
          navigate(`../${c}`);
        }}
        bodyClassName="mt-7"
        variant="line"
      />
    </>
  );
}
