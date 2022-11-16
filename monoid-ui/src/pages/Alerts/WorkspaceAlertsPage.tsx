import { useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import AlertRegion from '../../components/AlertRegion';
import Card, { CardDivider } from '../../components/Card';
import Input from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { DataDiscovery } from '../../lib/models';
import DataDiscoveryRow from '../Silos/pages/SiloPage/components/DataDiscoveryRow';
import { GET_WORKSPACE_DISCOVERIES } from '../../graphql/discovery_query';

function AlertListCardBody(props: { query: string }) {
  const { id } = useParams<{ siloId: string, id: string }>();
  const { query } = props;

  const [offset, setOffset] = useState(0);
  const {
    data, loading, error, fetchMore,
  } = useQuery(GET_WORKSPACE_DISCOVERIES, {
    variables: {
      workspaceId: id,
      query: query && query.trim() !== '' ? query : undefined,
      statuses: [],
      limit: 10,
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
          data.workspace.discoveries.discoveries.map((d: DataDiscovery) => (
            <DataDiscoveryRow key={d.id!} discovery={d} showSiloDefinition />
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
        totalCount={data?.workspace.discoveries.numDiscoveries || 0}
      />
    </>
  );
}

export default function WorkspaceAlertsPage() {
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
      <PageHeader title="Alerts" />
      <Card innerClassName="py-0 pt-2 pb-0 sm:pb-0 sm:pt-2">
        <Input className="mt-4" placeholder="Alert ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CardDivider />
        <AlertListCardBody query={query} />
      </Card>
    </>
  );
}
