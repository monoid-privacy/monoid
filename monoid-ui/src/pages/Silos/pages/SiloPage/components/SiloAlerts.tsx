import {
  ApolloError, gql, useMutation, useQuery,
} from '@apollo/client';
import React, {
  ReactNode, useCallback, useContext, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  CheckCircleIcon,
  ChevronDownIcon, ChevronRightIcon, CircleStackIcon, ExclamationCircleIcon, FolderIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import AlertRegion from '../../../../../components/AlertRegion';
import Card, { CardHeader, CardDivider } from '../../../../../components/Card';
import Spinner from '../../../../../components/Spinner';
import {
  DataDiscovery, DataSource, NewDataSourceDiscoveryData, NewPropertyDiscoveryData,
} from '../../../../../lib/models';
import Text from '../../../../../components/Text';
import Badge from '../../../../../components/Badge';
import Button from '../../../../../components/Button';
import Table from '../../../../../components/Table';
import ToastContext from '../../../../../contexts/ToastContext';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const deletedDatasourceError = 'Error finding data source.';

const GET_DISCOVERIES = gql`
  query GetScanSchedule($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      siloDefinition(id: $id) {
        id
        discoveries {
          id
          type
          status
          createdAt
          data {
            __typename
            ... on NewDataSourceDiscovery {
              name
              group
              properties {
                name
              }
            }
            ... on NewPropertyDiscovery {
              name
              dataSourceId
            }
            ... on NewCategoryDiscovery {
              propertyId
              categoryId
            }
            ... on ObjectMissingDiscovery {
              id
            }
          }
        }
      }
    }
  }
  `;

const GET_DATA_SOURCE = gql`
  query GetDataSource($id: ID!) {
    dataSource(id: $id) {
      id
      name
      group
      properties {
        id
        name
      }
    }
  }
`;

const APPLY_DISCOVERY = gql`
  mutation ApplyDiscovery($input: HandleDiscoveryInput!) {
    handleDiscovery(input: $input) {
      id
      status
    }
  }
`;

function DataSourceBody(props: {
  dataSource: NewDataSourceDiscoveryData,
  open: boolean,
}) {
  const { open, dataSource } = props;

  return (
    <>
      <div className="mt-2">
        <Text size="sm">
          {dataSource.name}
        </Text>
        <Text size="xs" em="light" className="flex items-center">
          <FolderIcon className="w-3 h-3 mr-1" />
          {dataSource.group}
        </Text>
        <Badge className="mt-2">
          {dataSource.properties?.length}
          {' '}
          Properties
        </Badge>
      </div>
      {open
        && (
          <Table
            tableCols={[
              {
                header: 'Property Name',
                key: 'name',
              },
            ]}
            tableRows={dataSource.properties?.map((d) => (
              {
                key: d.name!,
                columns: [{
                  key: 'name',
                  content: d.name!,
                }],
              }
            ))}
            className="mt-2"
          />
        )}
    </>

  );
}

function PropertyBody(props: {
  property: NewPropertyDiscoveryData,
}) {
  const { property } = props;
  const { data, loading, error } = useQuery<{ dataSource: DataSource }>(GET_DATA_SOURCE, {
    variables: {
      id: property.dataSourceId!,
    },
  });
  const dataSource = data?.dataSource;

  if (loading) {
    return <Spinner />;
  }

  if (error && error.message !== deletedDatasourceError) {
    return <AlertRegion alertTitle="Error">{error.message}</AlertRegion>;
  }

  return (
    <div className="mt-2">
      <Text size="sm">
        {property.name}
      </Text>
      <Text size="xs" em="light" className="flex items-center mt-1">
        {
          error?.message === deletedDatasourceError ? 'Data Source has been removed.'
            : (
              <>
                <CircleStackIcon className="w-3 h-3 mr-1" />

                <div className="mr-5">
                  {dataSource?.name}
                </div>
                <FolderIcon className="w-3 h-3 mr-1" />
                <div>{dataSource?.group}</div>
              </>
            )
        }
      </Text>
    </div>

  );
}

function LoadedDataSourceBody(props: {
  dataSourceId: string,
  open: boolean
}) {
  const { dataSourceId, open } = props;

  const { data, loading, error } = useQuery<{ dataSource: DataSource }>(GET_DATA_SOURCE, {
    variables: {
      id: dataSourceId,
    },
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    if (error.message === deletedDatasourceError) {
      return (
        <Text size="sm" className="mt-2">
          Data Source has been removed.
        </Text>
      );
    }
    return <AlertRegion alertTitle="error">{error.message}</AlertRegion>;
  }

  return (
    <DataSourceBody
      dataSource={
        {
          name: data!.dataSource.name!,
          group: data!.dataSource.group,
          properties: data!.dataSource.properties?.map((p) => ({
            name: p.name!,
          })),
        }
      }
      open={open}
    />
  );
}

function DiscoveryItem(props: { discovery: DataDiscovery }) {
  const { discovery } = props;
  const [open, setOpen] = useState(false);
  const [applyDiscovery, applyDiscoveryRes] = useMutation(APPLY_DISCOVERY);
  const toastCtx = useContext(ToastContext);

  const apply = useCallback((value: 'ACCEPT' | 'REJECT') => {
    applyDiscovery({
      variables: {
        input: {
          discoveryId: discovery.id,
          action: value,
        },
      },
    }).then(() => {
      toastCtx.showToast({
        title: 'Success',
        message: 'Changes Applied',
        variant: 'success',
        icon: CheckCircleIcon,
      });
    }).catch((err: ApolloError) => {
      toastCtx.showToast({
        title: 'Error',
        message: err.message,
        variant: 'danger',
        icon: XCircleIcon,
      });
    });
  }, [applyDiscovery, toastCtx]);

  let title = '';
  let body: ReactNode;

  if (discovery.type === 'CATEGORY_FOUND') {
    title = '';
  } else if (discovery.type === 'DATA_SOURCE_FOUND') {
    title = 'New Data Source Found';
    body = (
      <DataSourceBody
        dataSource={discovery.data!}
        open={open}
      />
    );
  } else if (discovery.type === 'DATA_SOURCE_MISSING') {
    title = 'Data Source Deleted';
    body = discovery.data!.id!;
    body = (
      <LoadedDataSourceBody
        dataSourceId={discovery.data!.id!}
        open={open}
      />
    );
  } else if (discovery.type === 'PROPERTY_FOUND') {
    title = 'New Property Found';
    body = (
      <PropertyBody property={discovery!.data!} />
    );
  } else if (discovery.type === 'PROPERTY_MISSING') {
    title = 'Property Deleted';
  }

  let statusIcon = <ExclamationCircleIcon className="w-6 h-6 mr-2 text-blue-600" />;

  switch (discovery.status) {
    case 'ACCEPTED':
      statusIcon = <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600" />;
      break;
    case 'REJECTED':
      statusIcon = <XCircleIcon className="w-6 h-6 mr-2 text-red-600" />;
      break;
    case 'OPEN':
      statusIcon = <ExclamationCircleIcon className="w-6 h-6 mr-2 text-blue-600" />;
      break;
    default:
  }

  return (
    <li>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="block hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen(!open)}
        onKeyDown={
          (ev) => {
            if (ev.key === 'ArrowDown') {
              setOpen(!open);
            }
          }
        }
      >
        <div className="px-4 py-4 sm:px-6 flex items-center">
          <div className="flex flex-col flex-1 mr-10">
            <Text em="bold" className="flex">
              {statusIcon}
              {title}
            </Text>
            {body}
            {
              discovery.status === 'OPEN'
              && (
                <div className="mt-3 space-x-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      apply('ACCEPT');
                    }}
                  >
                    {applyDiscoveryRes.loading ? <Spinner />
                      : 'Approve All'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      apply('REJECT');
                    }}
                  >
                    {applyDiscoveryRes.loading ? <Spinner /> : 'Reject'}
                  </Button>
                </div>
              )
            }
          </div>
          <div className="ml-auto flex items-center">
            <Text em="light" size="sm">
              {dayjs(discovery.createdAt).fromNow()}
            </Text>
            <Text em="light" className="ml-2">
              {
                open ? <ChevronDownIcon className="w-6 h-6" />
                  : <ChevronRightIcon className="w-6 h-6" />
              }
            </Text>
          </div>
        </div>
      </div>
    </li>
  );
}

function SiloCardBody() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery(GET_DISCOVERIES, {
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
    <ul className="divide-y divide-gray-200">
      {
        data.workspace.siloDefinition.discoveries.map((d: DataDiscovery) => (
          <DiscoveryItem key={d.id!} discovery={d} />
        ))
      }
    </ul>
  );
}

export default function SiloAlerts() {
  return (
    <Card>
      <CardHeader>
        Alerts
      </CardHeader>
      <CardDivider />
      <SiloCardBody />
    </Card>
  );
}
