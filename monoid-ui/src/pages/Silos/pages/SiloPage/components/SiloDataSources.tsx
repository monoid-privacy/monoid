import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import Table from '../../../../../components/Table';
import { DataSource } from '../../../../../lib/models';

const RUN_SOURCE_SCAN = gql`
  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {
    detectSiloSources(id: $id, workspaceId: $workspaceId)
  }
`;

const SILO_DATA_SOURCES = gql`
  query SiloDataSources($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      siloDefinition(id: $id) {
        dataSources {
          id
          name
          properties {
            id
          }
        }
      }
    }
  }
`;

export default function SiloDataSources() {
  const [runScan, runScanRes] = useMutation(RUN_SOURCE_SCAN);
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery(SILO_DATA_SOURCES, {
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
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  console.log(data);
  return (
    <>
      <Button onClick={() => {
        runScan({
          variables: {
            id: siloId,
            workspaceId: id,
          },
        });
      }}
      >
        {runScanRes.loading ? <Spinner /> : 'Run Scan'}
      </Button>
      <Table
        tableCols={[
          {
            header: 'Name',
            key: 'name',
          },
          {
            header: 'Tracked Properties',
            key: 'properties',
          },
        ]}
        tableRows={data?.workspace.siloDefinition.dataSources.map((ds: DataSource) => ({
          key: ds.id!,
          columns: [
            {
              key: 'name',
              content: ds.name,
            },
            {
              key: 'properties',
              content: `${ds.properties!.length}`,
            },
          ],
        }
        ))}
        className="mt-3"
      />
    </>
  );
}
