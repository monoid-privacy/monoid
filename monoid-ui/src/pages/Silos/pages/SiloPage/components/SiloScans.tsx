import {
  gql,
} from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import { CheckCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useQuery from '../../../../../hooks/useQueryPatched';
import AlertRegion from '../../../../../components/AlertRegion';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import Input from '../../../../../components/Input';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';
import ToastContext from '../../../../../contexts/ToastContext';
import Pagination from '../../../../../components/Pagination';
import JobRow from './JobRow';
import EmptyState from '../../../../../components/Empty';
import ScanButtonRegion from './ScanButton';
import Text from '../../../../../components/Text';
import { BristA } from '../../../../../components/Link';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const GET_SCANS = gql`
  query DiscoverJobs($workspaceId: ID!, $resourceId: ID!, $limit: Int!, $offset: Int!, $query: String) {
    workspace(id: $workspaceId) {
      id
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
  }
`;

const limit = 10;

function JobList(props: {
  query: string
}) {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { query } = props;
  const [offset, setOffset] = useState(0);
  const toastCtx = useContext(ToastContext);

  const {
    data, loading, error, fetchMore, refetch,
  } = useQuery<{
    workspace: {
      jobs: {
        jobs: Job[],
        numJobs: number
      }
    }
  }>(GET_SCANS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
    variables: {
      resourceId: siloId,
      workspaceId: id,
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

  if (!data?.workspace.jobs.jobs.length) {
    return (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="No Scans"
        subtitle="When you run a scan, it will show up here"
        action={(
          <ScanButtonRegion
            siloId={siloId!}
            workspaceId={id!}
            onScanStatusChange={(s) => {
              if (s === 'COMPLETED') {
                refetch();
                toastCtx.showToast({
                  variant: 'success',
                  title: 'Scan Complete',
                  message: 'Data silo has finished scanning sources.',
                  icon: CheckCircleIcon,
                });
              }
            }}
          >
            Scan
          </ScanButtonRegion>
        )}
        className="py-7"
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {
          data?.workspace.jobs.jobs.map((j) => (
            <JobRow key={j.id} job={j} openable />
          ))
        }
      </ul>
      <Pagination
        className="mt-5 sm:-mb-6 -mb-5"
        limit={limit}
        offset={offset}
        onOffsetChange={(o) => fetchMore({
          variables: {
            offset: o,
          },
        }).then(() => setOffset(o))}
        totalCount={data?.workspace.jobs.numJobs || 0}
      />
    </>
  );
}

function ScanSettingsCard() {
  return (
    <Card>
      <CardHeader>
        Scan Settings
      </CardHeader>
      <CardDivider />
      <div>
        <Text em="bold" size="md">
          {' '}
          Automated scanning requires a
          {' '}
          <BristA href="http://monoid.co/#pricing" className="underline" target="_blank">license</BristA>
          .
          {' '}
        </Text>
        <Text size="sm">
          You can initiate a scan from the data sources tab.
        </Text>
      </div>
    </Card>
  );
}

export default function SiloScans() {
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
      <Card>
        <CardHeader>
          Scan History
        </CardHeader>
        <Input className="mt-4" placeholder="Job ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CardDivider />
        <JobList query={query} />
      </Card>
    </div>
  );
}
