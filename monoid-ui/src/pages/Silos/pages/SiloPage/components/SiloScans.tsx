import {
  ApolloError, gql, useMutation, useQuery,
} from '@apollo/client';
import React, { useContext, useState } from 'react';
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
import Pagination from '../../../../../components/Pagination';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const GET_SCANS = gql`
  query DiscoverJobs($resourceId: ID!, $limit: Int!, $offset: Int!) {
    jobs(
      resourceId: $resourceId,
      jobType: "discover_sources",
      limit: $limit,
      offset: $offset
    ) {
      jobs {
        id
        jobType
        status
        createdAt
      }
      numJobs
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

const limit = 10;

function JobList(props: {
  siloID: string
}) {
  const { siloID } = props;
  const [offset, setOffset] = useState(0);

  const {
    data, loading, error, fetchMore,
  } = useQuery<{
    jobs: {
      jobs: Job[],
      numJobs: number
    }
  }>(GET_SCANS, {
    variables: {
      resourceId: siloID,
      limit,
      offset,
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
    <>
      <ul className="divide-y divide-gray-200">
        {
          data?.jobs.jobs.map((j) => (
            <JobRow key={j.id} job={j} />
          ))
        }
      </ul>
      <Pagination
        className="mt-5"
        limit={limit}
        offset={offset}
        onOffsetChange={(o) => fetchMore({
          variables: {
            offset: o,
          },
        }).then(() => setOffset(o))}
        totalCount={data?.jobs.numJobs || 0}
      />
    </>
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
      <Card innerClassName="py-0 pt-5 pb-0 sm:pb-0">
        <CardHeader>
          Scan History
        </CardHeader>
        <CardDivider />
        <JobList siloID={siloId!} />
      </Card>
    </div>
  );
}
