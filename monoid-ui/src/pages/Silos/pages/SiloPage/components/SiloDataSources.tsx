import React, { useContext } from 'react';
import {
  gql, useQuery,
} from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CircleStackIcon, ExclamationCircleIcon, FolderIcon,
} from '@heroicons/react/24/outline';

import Table from '../../../../../components/Table';
import { DataSource, Property, SiloDefinition } from '../../../../../lib/models';
import CategoryCombobox from './CategoryCombobox';
import Badge from '../../../../../components/Badge';
import { classNames, dedup } from '../../../../../utils/utils';
import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import ScanButtonRegion from './ScanButton';
import EmptyState from '../../../../../components/Empty';
import Button from '../../../../../components/Button';
import IdentifierSelect from './IdentifierSelect';
import Text from '../../../../../components/Text';
import { MonoidA } from '../../../../../components/MonoidLink';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';

const SILO_DATA_SOURCES = gql`
  query SiloDataSources($id: ID!) {
    siloDefinition(id: $id) {
      id
      dataSources {
        id
        name
        group
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
`;

export default function SiloDataSources() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const {
    data, loading, error, refetch,
  } = useQuery<{ siloDefinition: SiloDefinition }>(SILO_DATA_SOURCES, {
    variables: {
      id: siloId,
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

  const empty = !data?.siloDefinition?.dataSources?.length;

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
                  message: 'Data silo scan has finished.',
                  icon: ExclamationCircleIcon,
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
                {
                  header: (
                    <div className="flex-flex-col">
                      <div>Purpose of Processing</div>
                      <Text em="light">
                        Requires
                        <MonoidA href="https://monoid.co" className="ml-1 underline" target="_blank">a license</MonoidA>
                      </Text>
                    </div>
                  ),
                  key: 'purposes',
                },
              ]}
              tableRows={data?.siloDefinition?.dataSources?.map((ds: DataSource) => ({
                key: ds.id!,
                columns: [
                  {
                    key: 'name',
                    content: (
                      <div className="flex flex-col items-start">
                        <div>
                          <div>{ds.name}</div>
                          <Text size="xs" em="light" className="flex items-center">
                            <FolderIcon className="w-3 h-3 mr-1" />
                            {ds.group}
                          </Text>
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
                            ds.properties?.flatMap((p) => p.categories || []) || [],
                            (c) => c.id!,
                          ).map((c) => (
                            <Badge key={c.id} color="blue">
                              {c.name}
                            </Badge>
                          ))
                        }
                      </div>
                    ),
                  },
                  {
                    key: 'purposes',
                    content: null,
                  },
                ],

                nestedComponent: (
                  <tr>
                    <td colSpan={4} className="p-0">
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
