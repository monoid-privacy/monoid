import { useQuery } from '@apollo/client';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmptyState from 'components/Empty';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { DiscoveryStatus } from '__generated__/graphql';
import AlertRegion from '../../../components/AlertRegion';
import Button from '../../../components/Button';

import Card, { CardDivider, CardHeader } from '../../../components/Card';
import Spinner from '../../../components/Spinner';
import { DataDiscovery } from '../../../lib/models';
import DataDiscoveryRow from '../../Silos/pages/SiloPage/components/DataDiscoveryRow';
import { GET_WORKSPACE_DISCOVERIES } from '../../../graphql/discovery_query';

function AlertsCardBody() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_WORKSPACE_DISCOVERIES, {
    variables: {
      workspaceId: id!,
      statuses: [DiscoveryStatus.Open],
      limit: 5,
      offset: 0,
    },
  });
  const navigate = useNavigate();

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

  if ((data?.workspace.discoveries.numDiscoveries || 0) === 0) {
    return (
      <EmptyState
        icon={BellAlertIcon}
        title="No Open Alerts"
        subtitle="You have no open alerts!"
        className="flex-1 flex flex-col justify-center"
        action={null}
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-200 overflow-scroll flex-1">
      {
        (data?.workspace.discoveries.discoveries as DataDiscovery[]).map((d) => (
          <DataDiscoveryRow
            key={d.id!}
            discovery={d}
            size="sm"
            onClick={() => {
              navigate(`../silos/${d.siloDefinition?.id}/alerts?query=${d.id}`);
            }}
            hideActions
            showSiloDefinition
          />
        ))
      }
    </ul>
  );
}

export default function AlertsCard() {
  const navigate = useNavigate();

  return (
    <Card className="flex-1 h-[30rem]" innerClassName="flex flex-col h-full">
      <CardHeader>
        Open Data Alerts
      </CardHeader>
      <CardDivider />
      <AlertsCardBody />
      <CardDivider />
      <div className="flex">
        <Button variant="outline-white" className="ml-auto" onClick={() => navigate('../alerts')}>
          View All
        </Button>
      </div>
    </Card>
  );
}
