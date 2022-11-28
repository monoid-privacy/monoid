import {
  gql, useQuery, useMutation, ApolloError,
} from '@apollo/client';
import React, { useContext } from 'react';
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
import StepView from '../../../../components/Steps';

const EXECUTE_REQUEST = gql`
  mutation ExecuteRequest($id: ID!, $workspaceId: ID!) {
    executeUserDataRequest(requestId: $id, workspaceId: $workspaceId) {
      id
      status
    }
  }
`;

const GET_REQUEST_METADATA = gql`
  query GetRequestMetadata($id: ID!) {
      request(id: $id) {
        id
        type
        status
      }
  }
`;

export default function RequestPage(
  props: {
    tab: 'request_statuses' | 'primary_key_values'
  },
) {
  const { tab } = props;
  const [executeReq, executeReqRes] = useMutation<{ executeUserDataRequest: Job }>(EXECUTE_REQUEST);
  const navigate = useNavigate();
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
          <div className="flex flex-col space-y-2 items-end">
            {
              (request?.status === 'CREATED' || request?.status === 'FAILED')
              && (
                <Button onClick={() => {
                  executeReq({
                    variables: {
                      id: requestId,
                      workspaceId: id,
                    },
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
              )
            }
          </div>
        )}
      />
      <StepView
        steps={[
          {
            id: '1',
            name: 'Created',
            status: 'complete',
            completedDesc: 'The request was created.',
            upcomingDesc: '',
          },
          {
            id: '2',
            name: 'Processing',
            status: request?.status === 'CREATED' ? 'upcoming' : 'complete',
            completedDesc: 'You executed the request.',
            upcomingDesc: 'The request will start processing once you execute the request.',
          },
          {
            id: '3',
            name: (request?.status === 'FAILED' ? 'Failed' : 'Finished'),
            // eslint-disable-next-line no-nested-ternary
            status: request?.status === 'CREATED' || request?.status === 'IN_PROGRESS' ? 'upcoming' : (
              request?.status === 'EXECUTED' ? 'complete' : 'failed'
            ),
            completedDesc: (request?.status === 'FAILED'
              ? 'The request failed.' : 'The request completed successfully.'
            ),
            upcomingDesc: 'The request will start processing once you execute the request.',
          },
        ]}
      />
      <Tabs
        tabs={[
          {
            tabName: 'Request Statuses',
            tabKey: 'request_statuses',
            tabBody: <RequestStatuses />,
          },
          {
            tabName: 'User Identifiers',
            tabKey: 'primary_key_values',
            tabBody: <PrimaryKeyValues />,
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
