import {
  ApolloError, gql, useMutation, useQuery,
} from '@apollo/client';
import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircleIcon, QuestionMarkCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import AlertRegion from '../../../../../components/AlertRegion';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import { InputLabel } from '../../../../../components/Input';
import Select from '../../../../../components/Select';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';
import Text from '../../../../../components/Text';
import ToastContext from '../../../../../contexts/ToastContext';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const GET_SCANS = gql`
  query RunningDiscoverJobs($resourceId: ID!) {
    jobs(resourceId: $resourceId, jobType: "discover_sources") {
      id
      jobType
      status
      createdAt
    }
  }
`;

const GET_SCAN_SCHEDULE = gql`
  query GetScanSchedule($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      siloDefinition(id: $id) {
        id
        scanConfig {
          cron
        }
      }
    }
  }
`;

const UPDATE_SCAN_SCHEDULE = gql`
  mutation UpdateScanSchedule($input: SiloScanConfigInput!) {
    updateSiloScanConfig(input: $input) {
      id
      scanConfig {
        cron
      }
    }
  }
`;

const scanIntervals = [
  1,
  3,
  12,
  24,
  24 * 7,
  24 * 30,
];

const scanOptions = [
  {
    label: 'Manually',
    value: '',
  },
  ...scanIntervals.map((v) => (
    {
      label: `Every ${dayjs.duration(v, 'hours').humanize().replace(/(^a|an)\w*/, '')}`,
      value: `0 */${v} * * *`,
    }
  )),
];

function JobRow(props: {
  job: Job
}) {
  const { job } = props;
  let jobStatusText = '';
  let jobIcon = <QuestionMarkCircleIcon className="h-5 w-5" />;

  switch (job.status) {
    case 'RUNNING':
      jobStatusText = 'Scan Running';
      jobIcon = <Spinner />;
      break;
    case 'QUEUED':
      jobStatusText = 'Scan Queued';
      jobIcon = <Spinner />;
      break;
    case 'FAILED':
      jobStatusText = 'Scan Failed';
      jobIcon = <XCircleIcon className="h-7 w-7 text-red-600" />;
      break;
    case 'COMPLETED':
      jobStatusText = 'Scan Succeeded';
      jobIcon = <CheckCircleIcon className="h-7 w-7 text-green-400" />;
      break;
    default:
      break;
  }

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6 flex items-center">
          <div className="flex flex-col">
            <Text size="md">
              {jobStatusText}
            </Text>
            <Text size="xs" em="light">
              Ran
              {' '}
              {dayjs(job.createdAt!).fromNow()}
              {' '}
              |
              {' '}
              {dayjs(job.createdAt!).format('YYYY-MM-DD @ HH:MM:ss')}
            </Text>
          </div>
          <div className="ml-auto">
            {jobIcon}
          </div>
        </div>
      </div>
    </li>
  );
}

function JobList(props: {
  siloID: string
}) {
  const { siloID } = props;

  const { data, loading, error } = useQuery<{
    jobs: Job[]
  }>(GET_SCANS, {
    variables: {
      resourceId: siloID,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {
        data?.jobs.map((j) => (
          <JobRow key={j.id} job={j} />
        ))
      }
    </ul>
  );
}

function ScanSettingsCard() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery(GET_SCAN_SCHEDULE, {
    variables: {
      workspaceId: id,
      id: siloId,
    },
  });
  const [updateScanSchedule, updateScanRes] = useMutation(UPDATE_SCAN_SCHEDULE);
  const toastCtx = useContext(ToastContext);

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  return (
    <Card>
      <CardHeader>
        Scan Settings
      </CardHeader>
      <CardDivider />
      <div>
        {loading
          ? <Spinner />
          : (
            <>
              <InputLabel htmlFor="scan-select" className="mb-2">
                Scan Frequency
              </InputLabel>
              <Select
                id="scan-select"
                onChange={(e) => {
                  updateScanSchedule({
                    variables: {
                      input: {
                        siloId,
                        cron: e.target.value,
                      },
                    },
                  }).catch((err: ApolloError) => {
                    toastCtx.showToast({
                      title: 'Error',
                      message: err.message,
                      variant: 'danger',
                      icon: XCircleIcon,
                    });
                  });
                }}
                value={
                  data.workspace.siloDefinition.scanConfig.cron || ''
                }
              >
                {!updateScanRes.loading
                  && scanOptions.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
              </Select>
            </>
          )}
      </div>
    </Card>
  );
}

export default function SiloScans() {
  const { siloId } = useParams<{ siloId: string }>();

  return (
    <div className="space-y-4">
      <ScanSettingsCard />
      <Card>
        <CardHeader>
          Scan History
        </CardHeader>
        <CardDivider />
        <JobList siloID={siloId!} />
      </Card>
    </div>
  );
}
