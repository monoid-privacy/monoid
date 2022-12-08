/* eslint-disable no-nested-ternary */
import NewPrimaryKeyForm from 'pages/Identifiers/pages/NewPrimaryKeyPage/components/NewPrimaryKeyForm';
import React, {
  ReactNode, useContext, useState, useEffect,
} from 'react';
import { SimpleStepView } from 'components/Steps';
import ToastContext from 'contexts/ToastContext';
import { ChevronRightIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from 'components/PageHeader';
import Text from 'components/Text';
import NewSiloForm from 'pages/Silos/pages/NewSiloPage/components/NewSiloForm';
import { BristA } from 'components/Link';
import { ApplyAlertsButton, SiloAlertCardBody } from 'pages/Silos/pages/SiloPage/components/SiloAlerts';
import Card from 'components/Card';
import { RUN_SOURCE_SCAN } from 'graphql/jobs_queries';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Job } from 'lib/models';
import { useParams } from 'react-router-dom';
import Spinner from 'components/Spinner';
import AlertRegion from 'components/AlertRegion';
import Button from 'components/Button';
import DataSourcesTable from 'pages/Silos/pages/SiloPage/components/DataSourcesTable';

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

function AlertStepBody(props: {
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
        <div className="flex space-x-2 mb-4">
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
        {scanFinished && <SiloAlertCardBody query="" siloId={siloId} />}
      </Card>
    </>
  );
}

function CreateSiloDefBody(props: {
  onSuccess: (siloDefId: string, jobId: string) => void
}) {
  const { onSuccess } = props;
  const toastCtx = useContext(ToastContext);
  const [runScan] = useMutation<{ detectSiloSources: Job }>(RUN_SOURCE_SCAN);
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageHeader title="Sync Data Silo" className="mb-2" />
      <Text className="mb-4" size="sm">
        Start by connecting a data silo that uses the identifier defined in the
        previous step. Brist will automatically scan the silo and find the data sources
        and categorize them.
      </Text>
      <NewSiloForm
        onSuccess={(sd) => {
          runScan({
            variables: {
              id: sd.id!,
              workspaceId: id,
            },
          }).then(({ data }) => {
            onSuccess(sd.id!, data?.detectSiloSources.id!);
          }).catch((err) => {
            toastCtx.showToast({
              title: 'Error',
              message: err.message,
              icon: XCircleIcon,
              variant: 'danger',
            });
          });
        }}
        onError={() => { }}
        onCancel={() => {
          toastCtx.showToast({
            title: 'Cancelled',
            message: 'Cancelled successfully.',
            icon: ExclamationCircleIcon,
            variant: 'success',
          });
        }}
      />
    </>
  );
}

export default function OnboardingFlow() {
  const [onboardingState, setOnboardingState] = useState<{
    siloDefinitionId?: string,
    jobId?: string,
    step: number
  }>({
    siloDefinitionId: undefined,
    jobId: undefined,
    step: 0,
  });

  let stepBody: ReactNode;
  const toastCtx = useContext(ToastContext);
  console.log('Hi', onboardingState.step);

  if (onboardingState.step === 0) {
    stepBody = (
      <>
        <PageHeader title="Create User Identifier" className="mb-2" />
        <Text className="mb-4" size="sm">
          The core of Brist&apos;s automations are user identifiers. You can use them to
          define the fields of your data sources that can be used to query for user data.
          You&apos;ll have to provide these identifiers when you create a data request.
        </Text>
        <NewPrimaryKeyForm
          onSuccess={() => {
            setOnboardingState({
              ...onboardingState,
              step: 1,
            });
          }}
          onError={(err) => {
            toastCtx.showToast(
              {
                title: 'Error Creating Identifier',
                message: err.message,
                variant: 'danger',
                icon: XCircleIcon,
              },
            );
          }}
        />
      </>
    );
  } else if (onboardingState.step === 1) {
    stepBody = (
      <CreateSiloDefBody onSuccess={(sdid, jobId) => {
        setOnboardingState({
          ...onboardingState,
          jobId,
          siloDefinitionId: sdid,
          step: 2,
        });
      }}
      />
    );
  } else if (onboardingState.step === 2) {
    stepBody = (
      <AlertStepBody
        siloId={onboardingState.siloDefinitionId || ''}
        jobId={onboardingState.jobId || ''}
        onSuccess={() => {
          setOnboardingState({
            ...onboardingState,
            step: 3,
          });
        }}
      />
    );
  } else if (onboardingState.step === 3) {
    console.log('Hi');
    stepBody = (
      <>
        <PageHeader title="Link User Identifiers" className="mb-2" />
        <Text className="mb-4" size="sm">
          Review the data sources you just created, and link the relevant user identifiers
          to the properties they correspond to. We&apos;ll use this information to process
          right-to-know and deletion requests.
        </Text>

        <div className="flex mb-4">
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => {
              setOnboardingState({
                ...onboardingState,
                step: 4,
              });
            }}
          >
            <div className="flex items-center space-x-1">
              <div>Next</div>
              <ChevronRightIcon className="w-4 h-4" />
            </div>
          </Button>
        </div>

        <DataSourcesTable siloId={onboardingState.siloDefinitionId!} type="card" />

      </>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="self-center mb-4">
        <SimpleStepView steps={[0, 1, 2, 3, 4].map((i) => (
          {
            id: `${i}`,
            name: '',
            status: i === onboardingState.step ? 'current' : (i > onboardingState.step ? 'upcoming' : 'complete'),
            description: '',
          }
        ))}
        />
      </div>
      {stepBody}
      <div className="flex space-x-4 mt-2">
        <BristA
          href="#"
          onClick={() => {
            setOnboardingState({
              ...onboardingState,
              step: onboardingState.step + 1,
            });
          }}
          className="mt-2 text-sm"
        >
          <div className="flex space-x-1 items-center">
            <div>Skip Step</div>
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </BristA>

        <BristA
          href="#"
          onClick={() => {
            setOnboardingState({
              ...onboardingState,
              step: 1,
            });
          }}
          className="mt-2 text-sm text-red-500 hover:text-red-700"
        >
          <div className="flex space-x-1 items-center">
            <div>Skip Onboarding</div>
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </BristA>
      </div>
    </div>
  );
}
