import {
  ApolloError, gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';
import { XCircleIcon } from '@heroicons/react/24/outline';
import React, { useContext, useEffect } from 'react';
import { RUN_SOURCE_SCAN } from 'graphql/jobs_queries';
import ToastContext from '../../../../../contexts/ToastContext';
import AlertRegion from '../../../../../components/AlertRegion';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';

const CANCEL_JOB = gql`
  mutation CancelJob($id: ID!) {
    cancelJob(id: $id) {
      id
      status
    }
  }
`;

const RUNNING_DETECT_SILO_JOBS = gql`
  query RunningDiscoverJobs($workspaceId: ID!, $resourceId: ID!) {
    workspace(id: $workspaceId) {
      id
      jobs(resourceId: $resourceId, jobType: "discover_sources", status: [RUNNING, QUEUED], limit: 1, offset: 0) {
        jobs {
          id
          jobType
          status
        }
      }
    }
  }
`;

type CoreScanButtonProps = {
  siloId: string,
  workspaceId: string,
  children: React.ReactNode
};

function CoreScanButton({ siloId, workspaceId, children }: CoreScanButtonProps) {
  const [runScan, runScanRes] = useMutation<{ detectSiloSources: Job }>(RUN_SOURCE_SCAN);
  const client = useApolloClient();
  const toastCtx = useContext(ToastContext);

  return (
    <Button onClick={() => {
      runScan({
        variables: {
          id: siloId,
          workspaceId,
        },
      }).then(({ data: resData }) => {
        client.writeQuery({
          query: RUNNING_DETECT_SILO_JOBS,
          data: {
            workspace: {
              __typename: 'Workspace',
              id: workspaceId,
              jobs: {
                jobs: [resData!.detectSiloSources],
              },
            },
          },
          variables: {
            resourceId: siloId,
            workspaceId,
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
      {runScanRes.loading ? <Spinner color="white" size="sm" /> : children}
    </Button>
  );
}

function ScanButtonRegion(props: {
  siloId: string,
  workspaceId: string,
  children: React.ReactNode,
  onScanStatusChange?: (status: 'COMPLETED' | 'STARTED') => void,
}) {
  const {
    siloId, workspaceId, children, onScanStatusChange,
  } = props;

  const {
    data,
    previousData,
    loading,
    refetch,
    error,
  } = useQuery<{ workspace: { jobs: { jobs: Job[] } } }>(RUNNING_DETECT_SILO_JOBS, {
    variables: {
      workspaceId,
      resourceId: siloId,
    },
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  });

  const [cancelJob, cancelJobRes] = useMutation(CANCEL_JOB);

  useEffect(() => {
    if (!onScanStatusChange || !previousData) {
      return;
    }

    if (previousData?.workspace.jobs.jobs.length === 0 && data?.workspace.jobs.jobs.length !== 0) {
      onScanStatusChange('STARTED');
    }

    if (previousData?.workspace.jobs.jobs.length !== 0 && data?.workspace.jobs.jobs.length === 0) {
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

  if (data!.workspace.jobs.jobs.length === 0) {
    return (
      <CoreScanButton siloId={siloId} workspaceId={workspaceId}>
        {children}
      </CoreScanButton>
    );
  }

  return (
    <Button
      onClick={() => {
        cancelJob({
          variables: {
            id: data!.workspace.jobs.jobs[0].id!,
          },
        }).then(() => refetch());
      }}
      variant="danger"
      disabled={cancelJobRes.loading}
    >
      {cancelJobRes.loading ? <Spinner /> : 'Cancel Scan'}
    </Button>
  );
}

ScanButtonRegion.defaultProps = {
  onScanStatusChange: () => { },
};

export default ScanButtonRegion;
