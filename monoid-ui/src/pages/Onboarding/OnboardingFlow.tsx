/* eslint-disable no-nested-ternary */
import React, {
  ReactNode, useContext, useMemo,
} from 'react';
import { SimpleStepView } from 'components/Steps';
import { ChevronRightIcon, XCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from 'components/PageHeader';
import Text from 'components/Text';
import { BristA } from 'components/Link';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from 'components/Button';
import { ApolloError, useMutation } from '@apollo/client';
import ToastContext from 'contexts/ToastContext';
import { gql } from '__generated__/gql';
import UserIdentifierStepBody from './components/UserIdentifierStepBody';
import CreateSiloDefBody from './components/CreateSiloDefBody';
import AlertStepBody from './components/AlertStepBody';
import RequestBody from './components/RequestStepBody';
import SiloSourcesBody from './components/SiloSourcesStepBody';

const COMPLETE_ONBOARDING = gql(`
  mutation CompleteOnboarding($id: ID!) {
    completeWorkspaceOnboarding(id: $id) {
      id
      onboardingComplete
    }
  }
`);

export default function OnboardingFlow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();

  const [completeOnboarding] = useMutation(COMPLETE_ONBOARDING, {
    variables: {
      id: id!,
    },
  });

  const toastCtx = useContext(ToastContext);

  type OnboardingState = {
    requestId: string | null,
    siloDefinitionId: string | null,
    step: number,
    jobId: string | null,
  };

  const setOnboardingState = (v: OnboardingState) => {
    const params = new URLSearchParams();

    if (v.requestId) {
      params.set('requestId', v.requestId);
    }

    if (v.siloDefinitionId) {
      params.set('siloDefinitionId', v.siloDefinitionId);
    }

    params.set('step', `${v.step}`);

    if (v.jobId) {
      params.set('jobId', v.jobId);
    }

    setSearchParams(params);
  };

  const onboardingState = useMemo<OnboardingState>(() => {
    const requestId = searchParams.get('requestId');
    const siloDefinitionId = searchParams.get('siloDefinitionId');
    let step = parseInt(searchParams.get('step') || '0', 10);
    const jobId = searchParams.get('jobId');

    if (step > 1 && !siloDefinitionId) {
      step = 1;
    }

    if (step > 2 && !jobId) {
      step = 2;
    }

    if (step > 4 && !requestId) {
      step = 4;
    }

    return {
      requestId,
      siloDefinitionId,
      jobId,
      step,
    };
  }, [searchParams]);

  let stepBody: ReactNode;
  const navigate = useNavigate();

  if (onboardingState.step === 0) {
    stepBody = (
      <UserIdentifierStepBody onSuccess={() => {
        setOnboardingState({
          ...onboardingState,
          step: 1,
        });
      }}
      />
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
    stepBody = (
      <SiloSourcesBody
        siloDefinitionId={onboardingState.siloDefinitionId || ''}
        onSuccess={() => {
          setOnboardingState({
            ...onboardingState,
            step: 4,
          });
        }}
      />
    );
  } else if (onboardingState.step === 4) {
    stepBody = (
      <RequestBody
        onSuccess={(reqId: string) => {
          setOnboardingState({
            ...onboardingState,
            requestId: reqId,
            step: 5,
          });
        }}
      />
    );
  } else if (onboardingState.step === 5) {
    stepBody = (
      <>
        <PageHeader title="Congratulations!" className="mb-2" />
        <Text className="mb-4" size="sm">
          You&apos;ve created your first Monoid silos and requests. Take a look at the
          request page to see the results.
        </Text>
        <div className="flex items-start">
          <Button onClick={() => {
            completeOnboarding().then(() => {
              navigate(`../requests/${onboardingState.requestId!}`);
            });
          }}
          >
            Complete Onboarding &amp; View Request
          </Button>
        </div>
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
      {onboardingState.step < 5
        && (
          <div className="flex space-x-4 mt-2">
            <BristA
              href="#"
              onClick={() => {
                completeOnboarding().then(() => {
                  navigate('..');
                }).catch((err: ApolloError) => toastCtx.showToast({
                  title: 'Error Completing Onboarding',
                  message: err.message,
                  icon: XCircleIcon,
                }));
              }}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              <div className="flex space-x-1 items-center">
                <div>Skip Onboarding</div>
                <ChevronRightIcon className="w-4 h-4" />
              </div>
            </BristA>
          </div>
        )}
    </div>
  );
}
