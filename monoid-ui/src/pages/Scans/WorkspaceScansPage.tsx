import { useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import AlertRegion from '../../components/AlertRegion';
import Card, { CardDivider } from '../../components/Card';
import Input from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { Job } from '../../lib/models';
import { GET_ALL_SCANS } from '../../graphql/jobs_queries';
import JobRow from '../Silos/pages/SiloPage/components/JobRow';

function ScansListCardBody(props: { query: string }) {
  const { query } = props;

  const [offset, setOffset] = useState(0);
  const { id } = useParams<{ id: string }>();
  const {
    data, loading, error, fetchMore,
  } = useQuery(GET_ALL_SCANS, {
    variables: {
      workspaceId: id,
      status: [],
      limit: 10,
      offset: 0,
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

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {
          data.workspace.jobs.jobs.map((j: Job) => (
            <JobRow key={j.id!} job={j} showSiloDefinition />
          ))
        }
      </ul>
      <Pagination
        className="mt-5"
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
      <Card innerClassName="py-0 pt-2 pb-0 sm:pb-0 sm:pt-2">
        <Input className="mt-4" placeholder="Job ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CardDivider />
        <ScansListCardBody query={query} />
      </Card>
    </>
  );
}
