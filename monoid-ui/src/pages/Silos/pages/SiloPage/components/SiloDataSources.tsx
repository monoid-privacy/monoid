import React, { useContext, useEffect } from 'react';
import {
  ApolloError,
  gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';
import { useParams } from 'react-router-dom';
import {
  CheckCircleIcon, MinusCircleIcon, PlusCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckIcon, XMarkIcon,
} from '@heroicons/react/24/solid';

import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import Table from '../../../../../components/Table';
import { DataSource, Job, Property } from '../../../../../lib/models';
import CategoryCombobox from './CategoryCombobox';
import Badge from '../../../../../components/Badge';
import { dedup } from '../../../../../utils/utils';
import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardHeader } from '../../../../../components/Card';

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
            tentative
          }
        }
      }
    }
  }
`;

const REVIEW_PROPERTIES = gql`
  mutation ReviewProperties($input: ReviewPropertiesInput!) {
    reviewProperties(input: $input) {
      id
      tentative
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

function TentativePropertyBadge(props: { property: Property }) {
  const { property } = props;
  const [reviewProperty, reviewPropertyRes] = useMutation(REVIEW_PROPERTIES);
  const toastCtx = useContext(ToastContext);

  return (
    <Badge
      key={property.id}
      className="mt-1"
      color={property.tentative === 'CREATED' ? 'green' : 'red'}
      actions={reviewPropertyRes.loading ? [] : [
        {
          onClick: () => {
            reviewProperty({
              variables: {
                input: {
                  propertyIDs: [property.id!],
                  reviewResult: 'APPROVE',
                },
              },
            }).catch((err: ApolloError) => {
              toastCtx.showToast({
                variant: 'danger',
                title: 'Error',
                message: err.message,
                icon: XCircleIcon,
              });
            });
          },
          content: (
            <CheckIcon className="w-3" />
          ),
        },
        {
          onClick: () => {
            reviewProperty({
              variables: {
                input: {
                  propertyIDs: [property.id!],
                  reviewResult: 'DENY',
                },
              },
            }).catch((err: ApolloError) => {
              toastCtx.showToast({
                variant: 'danger',
                title: 'Error',
                message: err.message,
                icon: XCircleIcon,
              });
            });
          },
          content: (
            <XMarkIcon className="w-3" />
          ),
        },
      ]}
    >
      {
        reviewPropertyRes.loading
          ? <Spinner />
          : (
            <div>
              {
                property.tentative === 'CREATED'
                  ? 'Scan: Discovered'
                  : 'Scan: Deleted'
              }
            </div>
          )
      }
    </Badge>
  );
}

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
    <Card innerClassName="px-0 py-0 sm:p-0" className="overflow-hidden">
      <CardHeader className="flex items-center px-4 py-4 sm:px-6">
        Sources
        <div className="ml-auto">
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
        </div>
      </CardHeader>
      <Table
        type="plain"
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
                      ds.properties?.flatMap((p) => p.categories?.map(((c) => {
                        if (!p.tentative) {
                          return {
                            ...c,
                            tentative: c.tentative,
                          };
                        }

                        if (p.tentative === 'DELETED') {
                          return {
                            ...c,
                            tentative: 'DELETED',
                          };
                        }
                        return {
                          ...c,
                          tentative: c.tentative ? c.tentative : p.tentative,
                        };
                      })) || []) || [],
                      (c) => c.id!,
                    ).map((c) => (
                      <Badge key={c.id} color={c.tentative ? 'yellow' : 'blue'}>
                        <div className="mr-1">
                          {c.tentative && (
                            c.tentative === 'CREATED'
                              ? <PlusCircleIcon className="w-4 h-4" />
                              : <MinusCircleIcon className="w-4 h-4" />
                          )}
                        </div>
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
                              content: (
                                <div className="flex flex-col items-start">
                                  {p.name}
                                  {p.tentative
                                    && (
                                      <TentativePropertyBadge
                                        key={p.id}
                                        property={p}
                                      />
                                    )}

                                </div>
                              ),
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
        innerClassName="border-t border-gray-300"
        nested
      />
    </Card>
  );
}
