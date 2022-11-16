import {
  ApolloError, gql, useMutation, useQuery,
} from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import AlertRegion from '../../../../../components/AlertRegion';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import Input, { InputLabel } from '../../../../../components/Input';
import Select from '../../../../../components/Select';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';
import ToastContext from '../../../../../contexts/ToastContext';
import Pagination from '../../../../../components/Pagination';
import JobRow from './JobRow';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const GET_SCANS = gql`
  query DiscoverJobs($resourceId: ID!, $limit: Int!, $offset: Int!, $query: String) {
    jobs(
      resourceId: $resourceId,
      jobType: "discover_sources",
      query: $query,
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

const limit = 10;

function JobList(props: {
  siloID: string,
  query: string
}) {
  const { siloID, query } = props;
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
      query: query.trim() !== '' ? query : undefined,
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
  const [query, setQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(location.search);
    const q = urlSearchParams.get('query');
    if (q && q.trim() !== '') {
      setQuery(q);
    }
  }, [location.search]);

  return (
    <div className="space-y-4">
      <ScanSettingsCard />
      <Card innerClassName="py-0 pt-5 pb-0 sm:pb-0">
        <CardHeader>
          Scan History
        </CardHeader>
        <Input className="mt-4" placeholder="Job ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CardDivider />
        <JobList siloID={siloId!} query={query} />
      </Card>
    </div>
  );
}
