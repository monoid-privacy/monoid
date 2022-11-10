import React, { useContext, useEffect } from 'react';
import {
  gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';
import { useParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import Table from '../../../../../components/Table';
import { DataSource, Job, Property } from '../../../../../lib/models';
import PageHeader from '../../../../../components/PageHeader';
import CategoryCombobox from './CategoryCombobox';
import Badge from '../../../../../components/Badge';
import { dedup } from '../../../../../utils/utils';
import ToastContext from '../../../../../contexts/ToastContext';

const RUN_SOURCE_SCAN = gql`
  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {
    detectSiloSources(id: $id, workspaceId: $workspaceId) {
      id
      status
      jobType
    }
  }
`;

const RUNNING_DETECT_SILO_JOBS = gql`
  query RunningDiscoverJobs($resourceId: ID!) {
    jobs(resourceId: $resourceId, jobType: "discover_sources", status: [RUNNING, QUEUED]) {
      id
      jobType
      status
    }
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
            categories {
              id
              name
            }
          }
        }
      }
    }
  }
`;

function ScanRegion(props: {
  siloId: string,
  children: React.ReactNode,
  onScanStatusChange?: (status: 'COMPLETED' | 'STARTED') => void,
}) {
  const { siloId, children, onScanStatusChange } = props;

  const {
    data,
    previousData,
    loading,
    error,
  } = useQuery<{ jobs: Job[] }>(RUNNING_DETECT_SILO_JOBS, {
    variables: {
      resourceId: siloId,
    },
    pollInterval: 5000,
  });

  useEffect(() => {
    if (!onScanStatusChange || !previousData) {
      return;
    }

    if (previousData?.jobs.length === 0 && data?.jobs.length !== 0) {
      onScanStatusChange('STARTED');
    }

    if (previousData?.jobs.length !== 0 && data?.jobs.length === 0) {
      onScanStatusChange('COMPLETED');
    }
  }, [data, previousData]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle={error.message} />
    );
  }

  if (data!.jobs.length === 0) {
    return (
      <div>
        {children}
      </div>
    );
  }

  return (
    <Button disabled>
      <div className="flex items-center">
        <div className="mr-1"> Scan In Progress </div>
        <Spinner size="sm" color="white" />
      </div>
    </Button>
  );
}

ScanRegion.defaultProps = {
  onScanStatusChange: () => { },
};

export default function SiloDataSources() {
  const [runScan, runScanRes] = useMutation<{ detectSiloSources: Job }>(RUN_SOURCE_SCAN);
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const {
    data, loading, error, refetch,
  } = useQuery(SILO_DATA_SOURCES, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });
  const client = useApolloClient();
  const toastCtx = useContext(ToastContext);

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
          <ScanRegion
            siloId={siloId!}
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
            <Button onClick={() => {
              runScan({
                variables: {
                  id: siloId,
                  workspaceId: id,
                },
              }).then(({ data: resData }) => {
                client.writeQuery({
                  query: RUNNING_DETECT_SILO_JOBS,
                  data: {
                    jobs: [resData!.detectSiloSources],
                  },
                  variables: {
                    resourceId: siloId,
                  },
                });
              });
            }}
            >
              {runScanRes.loading ? <Spinner color="white" size="sm" /> : 'Re-Scan'}
            </Button>
          </ScanRegion>
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
              content: (
                <div className="space-x-2">
                  {
                    dedup(
                      ds.properties?.flatMap((p) => p.categories || []) || [],
                      (c) => c.id!,
                    ).map((c) => (
                      <Badge key={c.id}>
                        {c.name}
                      </Badge>
                    ))
                  }
                </div>
              ),
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
                                <CategoryCombobox
                                  value={p.categories?.map((c) => c.id!) || []}
                                  propertyId={p.id!}
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
