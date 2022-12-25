import {
  CircleStackIcon, FolderIcon, XCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import Badge from 'components/Badge';
import Button from 'components/Button';
import { CardDivider } from 'components/Card';
import EmptyState from 'components/Empty';
import { MonoidA } from 'components/MonoidLink';
import Table from 'components/Table';
import Text from 'components/Text';
import { DataSource, Property, SiloDefinition } from 'lib/models';
import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dedup } from 'utils/utils';
import ConfirmButton from 'components/ConfirmButton';
import { gql } from '__generated__/gql';
import { ApolloError, useMutation } from '@apollo/client';
import ToastContext from 'contexts/ToastContext';
import PropertyCategoryCombobox from './PropertyCategoryCombobox';
import IdentifierSelect from './IdentifierSelect';

const DELETE_DATA_SOURCE = gql(`
  mutation DeleteDataSource($id: ID!) {
    deleteDataSource(id: $id)
  }
`);

const DELETE_PROPERTY = gql(`
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`);

function DeleteDataSourceButton(props: {
  ds: DataSource
}) {
  const { ds } = props;
  const [deleteDataSource] = useMutation(DELETE_DATA_SOURCE, {
    variables: {
      id: ds.id!,
    },
    update(cache) {
      const normalizedId = cache.identify({ id: ds.id!, __typename: 'DataSource' });
      cache.evict({ id: normalizedId });
      cache.gc();
    },
  });
  const toastCtx = useContext(ToastContext);

  return (
    <ConfirmButton
      onConfirm={(close) => {
        deleteDataSource().catch((err: ApolloError) => {
          toastCtx.showToast({
            title: 'Error',
            message: err.message,
            icon: XCircleIcon,
          });
          close();
        }).then(() => close());
      }}
      variant="outline-danger"
      className="ml-auto px-2"
      dialogTitle={`Confirm Delete Data Source: ${ds.name}`}
      dialogBody="If you delete this data source, it will no longer be tracked, and any associated alerts will be removed."
    >
      <XMarkIcon className="w-4 h-4" />
    </ConfirmButton>
  );
}

function DeletePropertyButton(props: {
  property: Property
}) {
  const { property } = props;
  const [deleteProperty] = useMutation(DELETE_PROPERTY, {
    variables: {
      id: property.id!,
    },
    update(cache) {
      const normalizedId = cache.identify({ id: property.id!, __typename: 'Property' });
      cache.evict({ id: normalizedId });
      cache.gc();
    },
  });
  const toastCtx = useContext(ToastContext);

  return (
    <ConfirmButton
      onConfirm={(close) => {
        deleteProperty().catch((err: ApolloError) => {
          toastCtx.showToast({
            title: 'Error',
            message: err.message,
            icon: XCircleIcon,
          });
          close();
        }).then(() => close());
      }}
      variant="outline-danger"
      className="ml-auto px-2"
      dialogTitle={`Confirm Delete Property: ${property.name}`}
      dialogBody="If you delete this property, it will no longer be tracked, and any associated alerts will be removed."
    >
      <XMarkIcon className="w-4 h-4" />
    </ConfirmButton>
  );
}

function DataSourcesTable(props: { siloDef?: SiloDefinition, type: 'card' | 'plain' }) {
  const { siloDef, type } = props;
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const empty = !siloDef?.dataSources?.length;

  if (!empty) {
    return (
      <Table
        type={type}
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
          { key: 'actions', header: '' },
        ]}
        tableRows={siloDef?.dataSources?.map((ds: DataSource) => ({
          key: ds.id!,
          columns: [
            {
              key: 'name',
              content: (
                <div className="flex flex-col items-start">
                  <div>
                    <div>{ds.name}</div>
                    {ds.group && (
                      <Text size="xs" em="light" className="flex items-center">
                        <FolderIcon className="w-3 h-3 mr-1" />
                        {ds.group}
                      </Text>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'properties',
              content: (
                <div className="flex flex-col space-y-1">
                  <div>
                    {ds.properties?.length || 0}
                    {' '}
                    {ds.properties?.length !== 1 ? 'Properties' : 'Property'}
                  </div>
                  {(ds.properties?.flatMap((p) => p.categories || []).length || 0) !== 0
                    && (
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
                    )}
                </div>
              ),
            },
            {
              key: 'purposes',
              content: null,
            },
            {
              key: 'actions',
              content: (
                <div className="flex w-full">
                  <DeleteDataSourceButton ds={ds} />
                </div>
              ),
            },
          ],

          nestedComponent: (
            <tr>
              <td colSpan={5} className="p-0">
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
                    }, {
                      header: '',
                      key: 'actions',
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
                                <PropertyCategoryCombobox
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
                            {
                              key: 'actions',
                              content: (
                                <div className="flex w-full">
                                  <DeletePropertyButton property={p} />
                                </div>
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
    );
  }

  return (
    <div className="md:px-6 md:-mt-6 px-4 -mt-5 md:pb-6 pb-4">
      <CardDivider />
      <EmptyState
        icon={CircleStackIcon}
        title="No Data Sources"
        subtitle={
          !siloDef?.siloSpecification!.manual
            ? 'You can find data sources by running a scan and applying alerts.'
            : 'Since this is a manual silo, you can create data sources manually.'
        }
        action={
          !siloDef?.siloSpecification!.manual ? (
            <Button onClick={() => navigate('../alerts')}>
              View Alerts
            </Button>
          ) : (
            <Button>
              New Data Source
            </Button>
          )
        }
        className="py-8"
      />
    </div>
  );
}

DataSourcesTable.defaultProps = {
  siloDef: undefined,
};

export default DataSourcesTable;
