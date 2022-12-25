import { useQuery } from '@apollo/client';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gql } from '__generated__/gql';
import AlertRegion from '../../../../components/AlertRegion';
import PageHeader from '../../../../components/PageHeader';
import Spinner from '../../../../components/Spinner';
import Tabs from '../../../../components/Tabs';
import SiloAlerts, { SiloAlertsTabHeader } from './components/SiloAlerts';
import SiloConfig from './components/SiloConfig';
import SiloDataSources from './components/SiloDataSources';
import SiloScans from './components/SiloScans';
import SVGText from '../../../../components/SVGText';

const GET_SILO_TITLE_DATA = gql(`
  query GetSiloTitle($id: ID!) {
    siloDefinition(id: $id) {
      id
      name
      siloSpecification {
        id
        name
        logo
      }
    }
  }
`);

export default function SiloPage(
  props: {
    tab: 'settings' | 'data_sources' | 'alerts' | 'scans'
  },
) {
  const { tab } = props;
  const navigate = useNavigate();
  const { siloId } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery(GET_SILO_TITLE_DATA, {
    variables: {
      id: siloId!,
    },
  });

  const siloDef = data?.siloDefinition;

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

  return (
    <>
      <PageHeader
        title={(
          <div className="flex items-center space-x-4">
            {siloDef?.siloSpecification?.logo
              && (
                <SVGText
                  className="w-9 h-9"
                  imageText={siloDef.siloSpecification.logo}
                  alt={`${siloDef?.siloSpecification?.name} Logo`}
                />
              )}
            <div>{siloDef?.name}</div>
          </div>
        )}
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
