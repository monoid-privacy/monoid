import { gql, useQuery } from '@apollo/client';
import PageHeader from 'components/PageHeader';
import { Job } from 'lib/models';
import { ApplyAlertsButton, SiloAlertCardBody } from 'pages/Silos/pages/SiloPage/components/SiloAlerts';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Text from 'components/Text';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from 'components/Button';
import Card from 'components/Card';
import Spinner from 'components/Spinner';
import AlertRegion from 'components/AlertRegion';

const GET_JOB = gql`
  query GetJobStatus($workspaceId: ID!, $id: ID!) {
    workspace(id: $workspaceId) {
      job(
        id: $id
      ) {
        id
        status
      }
    }
  }
`;

export default function AlertStepBody(props: {
  siloId: string,
  jobId: string,
  onSuccess: () => void,
}) {
  const { siloId, jobId, onSuccess } = props;
  const { id } = useParams<{ id: string }>();

  const {
    data, loading, error, stopPolling,
  } = useQuery<{ workspace: { job: Job } }>(GET_JOB, {
    variables: {
      id: jobId,
      workspaceId: id,
    },
    pollInterval: 1000,
  });

  useEffect(() => {
    if (loading) {
      return;
    }

    if (data?.workspace.job.status === 'COMPLETED' || data?.workspace.job.status === 'FAILED') {
      stopPolling();
    }
  }, [data, loading, stopPolling]);

  const scanLoading = loading || (!error && !(
    data?.workspace.job.status === 'COMPLETED'
    || data?.workspace.job.status === 'FAILED'
  ));

  const scanFinished = !scanLoading && !error;

  return (
    <>
      <PageHeader title="Review Alerts" className="mb-2" />
      <Text className="mb-4" size="sm">
        After Brist scans your silo (this may take a few minutes), review the sources, categories,
        and properties that are discovered, and add them to the data map.
      </Text>
      {scanFinished && (
        <div className="flex space-x-2 mb-4 justify-end">
          <ApplyAlertsButton
            siloId={siloId}
            onSuccess={() => {
              onSuccess();
            }}
          />
          <Button variant="primary" onClick={() => { onSuccess(); }}>
            <div className="flex items-center space-x-1">
              <div>Next</div>
              <ChevronRightIcon className="w-4 h-4" />
            </div>
          </Button>
        </div>
      )}
      <Card>
        {
          error && <AlertRegion alertTitle="Error">{error.message}</AlertRegion>
        }
        {
          scanLoading
          && (
            <div className="flex flex-col items-center text-gray-400">
              <Spinner />
              <div>Scanning Silo, this may take a few minutes...</div>
            </div>
          )
        }
        {scanFinished && (
          <SiloAlertCardBody
            statuses={['OPEN']}
            query=""
            siloId={siloId}
            hideEmptyAction
            emptyMessage="No new data was found in this silo, you can click next to continue."
          />
        )}
      </Card>
    </>
  );
}
