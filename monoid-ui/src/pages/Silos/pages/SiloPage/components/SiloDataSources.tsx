import React, { useContext } from 'react';
import {
  ApolloError,
  gql, useMutation, useQuery,
} from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircleIcon, CircleStackIcon, MinusCircleIcon, PlusCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckIcon, XMarkIcon,
} from '@heroicons/react/24/solid';

import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import Table from '../../../../../components/Table';
import { DataSource, Property } from '../../../../../lib/models';
import CategoryCombobox from './CategoryCombobox';
import Badge from '../../../../../components/Badge';
import { classNames, dedup } from '../../../../../utils/utils';
import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import ScanButtonRegion from './ScanButton';
import EmptyState from '../../../../../components/Empty';
import Button from '../../../../../components/Button';
import IdentifierSelect from './IdentifierSelect';

const SILO_DATA_SOURCES = gql`
  query SiloDataSources($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloDefinition(id: $id) {
        id
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
            userPrimaryKey {
              id
              name
            }
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
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const {
    data, loading, error, refetch,
  } = useQuery(SILO_DATA_SOURCES, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });
  const navigate = useNavigate();
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

  const empty = !data.workspace.siloDefinition.dataSources.length;

  return (
    <Card
      innerClassName={
        classNames(
          empty ? 'sm:pt-0' : 'py-0 px-0 sm:p-0',
        )
      }
      className="overflow-hidden"
    >
      <CardHeader className={classNames('flex items-center px-4 sm:px-6', empty ? 'pt-5 sm:pt-6' : 'py-5 sm:py-6')}>
        Sources
        <div className="ml-auto">
          <ScanButtonRegion
            siloId={siloId!}
            workspaceId={id!}
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
            Scan
          </ScanButtonRegion>
        </div>
      </CardHeader>
      {
        !empty
          ? (
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
                    content: (
                      <div className="flex flex-col items-start">
                        <div>{ds.name}</div>
                        <div className="space-x-2">
                          {
                            ds.tentative
                            && (
                              <Badge color={ds.tentative === 'CREATED' ? 'green' : 'red'} className="mt-2">
                                {ds.tentative === 'CREATED' ? 'Discovered' : 'Deleted'}
                              </Badge>
                            )
                          }
                          {
                            (ds.properties?.filter((p) => p.tentative).length || 0) !== 0
                            && (
                              <Badge color="yellow" className="mt-2">
                                Property Changes Discovered
                              </Badge>
                            )
                          }
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'properties',
                    content: (
                      <div className="space-x-2">
                        {
                          dedup(
                            // Get all the categories that are listed under the properties for
                            // the data source.
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
                          }, {
                            header: 'User Identifier',
                            key: 'user_identifier',
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
                                  {
                                    key: 'identifier',
                                    content: (
                                      <IdentifierSelect
                                        value={p.userPrimaryKey?.id}
                                        workspaceId={id!}
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
          )
          : (
            <>
              <CardDivider />
              <EmptyState
                icon={CircleStackIcon}
                title="No Data Sources"
                subtitle="You can find data sources by running a scan and applying alerts."
                action={(
                  <Button onClick={() => navigate('../alerts')}>
                    View Alerts
                  </Button>
                )}
                className="py-8"
              />
            </>
          )
      }
    </Card>
  );
}
