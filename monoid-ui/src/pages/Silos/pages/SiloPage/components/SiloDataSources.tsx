import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import Table from '../../../../../components/Table';
import { DataSource, Property } from '../../../../../lib/models';
import PageHeader from '../../../../../components/PageHeader';
import Combobox from '../../../../../components/Combobox';

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
            name
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

  return (
    <div>
      <PageHeader
        title="Sources"
        level="second"
        actionItem={(
          <Button onClick={() => {
            runScan({
              variables: {
                id: siloId,
                workspaceId: id,
              },
            });
          }}
          >
            {runScanRes.loading ? <Spinner /> : 'Re-Scan'}
          </Button>
        )}
      />

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
          nestedComponent: (
            <tr>
              <td colSpan={3} className="p-0">
                <div>
                  <Table
                    tableCols={[{
                      header: 'Property Name',
                      key: 'name',
                    }, {
                      header: 'Category',
                      key: 'cat',
                    }]}
                    tableRows={
                      ds.properties?.map(
                        (p: Property) => ({
                          key: p.id!,
                          columns: [
                            {
                              key: 'name',
                              content: p.name,
                            },
                            {
                              key: 'cat',
                              content: (
                                <Combobox
                                  value={undefined}
                                  onChange={() => { }}
                                  filter={() => ([])}
                                  id={(v) => `${v}`}
                                  displayText={(v) => `${v}`}
                                />
                              ),
                            },
                          ],
                        }),
                      )
                    }
                    type="plain"
                    insetClass="pl-12"
                    className="border-y-2 border-gray-300"
                  />
                </div>
              </td>
            </tr>
          ),
        }))}
        className="mt-3"
        nested
      />
    </div>
  );
}
