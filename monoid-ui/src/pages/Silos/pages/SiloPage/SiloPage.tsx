import { gql, useQuery } from '@apollo/client';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AlertRegion from '../../../../components/AlertRegion';
import PageHeader from '../../../../components/PageHeader';
import Spinner from '../../../../components/Spinner';
import Tabs from '../../../../components/Tabs';
import { SiloDefinition } from '../../../../lib/models';
import SiloAlerts, { SiloAlertsTabHeader } from './components/SiloAlerts';
import SiloConfig from './components/SiloConfig';
import SiloDataSources from './components/SiloDataSources';
import SiloScans from './components/SiloScans';

const GET_SILO_TITLE_DATA = gql`
  query GetSiloTitle($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      siloDefinition(id: $id) {
        name
        siloSpecification {
          name
          logoUrl
        }
      }
    }
  }
`;

export default function SiloPage(
  props: {
    tab: 'settings' | 'data_sources' | 'alerts' | 'scans'
  },
) {
  const { tab } = props;
  const navigate = useNavigate();
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      siloDefinition: SiloDefinition
    }
  }>(GET_SILO_TITLE_DATA, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion
        alertTitle="Error"
      >
        {error.message}
      </AlertRegion>
    );
  }

  const siloDef = data?.workspace.siloDefinition;

  return (
    <>
      <PageHeader
        title={siloDef?.name}
        subtitle={siloDef?.siloSpecification?.name}
      />
      <Tabs
        tabs={[
          {
            tabName: 'Data Sources',
            tabKey: 'data_sources',
            tabBody: <SiloDataSources />,
          }, {
            tabName: 'Silo Settings',
            tabKey: 'settings',
            tabBody: <SiloConfig />,
          }, {
            tabName: 'Scans',
            tabKey: 'scans',
            tabBody: <SiloScans />,
          }, {
            tabName: <SiloAlertsTabHeader />,
            tabKey: 'alerts',
            tabBody: <SiloAlerts />,
          },
        ]}
        current={tab}
        setCurrent={(c) => {
          navigate(`../${c}`);
        }}
        bodyClassName="mt-7"
        variant="line"
      />
    </>
  );
}
