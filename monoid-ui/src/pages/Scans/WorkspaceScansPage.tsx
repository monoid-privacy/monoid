import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useQuery from '../../hooks/useQueryPatched';
import AlertRegion from '../../components/AlertRegion';
import Card, { CardDivider } from '../../components/Card';
import Input from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { Job } from '../../lib/models';
import { GET_ALL_SCANS } from '../../graphql/jobs_queries';
import JobRow from '../Silos/pages/SiloPage/components/JobRow';
import EmptyState from '../../components/Empty';

function ScansListCardBody(props: { query: string }) {
  const { query } = props;

  const [offset, setOffset] = useState(0);
  const { id } = useParams<{ id: string }>();
  const {
    data, loading, error, fetchMore,
  } = useQuery(GET_ALL_SCANS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
    variables: {
      workspaceId: id!,
      status: [],
      limit: 10,
      offset,
      query: query && query.trim() !== '' ? query : undefined,
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
        subtitle="When you scan a data silo, scans will show up here."
        action={(
          <div />
        )}
        className="py-8"
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {
          (data?.workspace.jobs.jobs as Job[]).map((j: Job) => (
            <JobRow key={j.id!} job={j} showSiloDefinition />
          ))
        }
      </ul>
      <Pagination
        className="mt-5 sm:-mb-6 -mb-5"
        limit={10}
        offset={offset}
        onOffsetChange={(o) => {
          fetchMore({
            variables: {
              offset: o,
            },
          }).then(() => {
            setOffset(o);
          });
        }}
        totalCount={data?.workspace.jobs.numJobs || 0}
      />
    </>
  );
}

export default function WorkspaceScansPage() {
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
    <>
      <PageHeader title="Scans" />
      <Card>
        <Input className="mt-4" placeholder="Job ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CardDivider />
        <ScansListCardBody query={query} />
      </Card>
    </>
  );
}
