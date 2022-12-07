import React, {
  ReactNode, useCallback, useState, useContext,
} from 'react';
import { useMutation, ApolloError, gql } from '@apollo/client';
import {
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, ExclamationCircleIcon,
  XCircleIcon, CircleStackIcon, FolderIcon,
} from '@heroicons/react/24/outline';
import {
  ChevronRightIcon as SolidChevronRightIcon,
} from '@heroicons/react/24/solid';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import ToastContext from '../../../../../contexts/ToastContext';
import { DataDiscovery, NewDataSourceDiscoveryData, NewPropertyDiscoveryData } from '../../../../../lib/models';
import Badge from '../../../../../components/Badge';
import Text from '../../../../../components/Text';
import Table from '../../../../../components/Table';
import { dedup } from '../../../../../utils/utils';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';
import SVGText from '../../../../../components/SVGText';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

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
        <div className="mt-2 flex items-start flex-wrap gap-2">
          <Badge>
            {dataSource.properties?.length}
            {' '}
            Properties
          </Badge>
          {dedup(
            dataSource.properties?.flatMap(
              (p) => p.categories || [],
            ) || [],
            (v) => v.categoryId,
          ).map(
            (c) => (
              <Badge key={c.categoryId} color="red">
                {
                  c.category.name
                }
              </Badge>
            ),
          )}
        </div>
      </div>
      {open
        && (
          <Table
            tableCols={[
              {
                header: 'Property Name',
                key: 'name',
              },
              {
                header: 'Categories',
                key: 'categories',
              },
            ]}
            tableRows={dataSource.properties?.map((d) => (
              {
                key: d.name!,
                columns: [{
                  key: 'name',
                  content: d.name!,
                }, {
                  key: 'categories',
                  content: (
                    d.categories?.map(
                      (c) => (
                        <Badge key={c.categoryId} color="red">
                          {
                            c.category.name
                          }
                        </Badge>
                      ),
                    )
                  ),
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
  const { dataSource } = property;

  return (
    <>
      {
        (property.categories?.length || 0) > 0
        && (
          <div className="flex items-start mt-2">
            {
              property.categories?.map((c) => (
                <Badge key={c.categoryId} color="red">
                  {
                    c.category.name
                  }
                </Badge>
              ))
            }
          </div>
        )
      }
      <div className="mt-2">
        <Text as="div" size="xs" em="light" className="flex items-center mt-1">
          {
            !dataSource ? 'Data Source has been removed.'
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
        <code className="text-sm">
          {property.name}
        </code>
      </div>
    </>

  );
}

function DiscoveryItem(props: {
  discovery: DataDiscovery,
  hideActions?: boolean,
  hideStatus?: boolean,
  showSiloDefinition?: boolean
  size?: 'sm' | 'md',
  onClick?: () => void
}) {
  const {
    discovery, hideActions, size, onClick, showSiloDefinition,
    hideStatus,
  } = props;
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
    title = 'Data Category Found';

    body = (
      <>
        {
          discovery.data?.property
            ? (
              <PropertyBody
                property={{
                  name: discovery.data.property.name!,
                  dataSourceId: discovery.data.property.dataSource?.id!,
                  dataSource: discovery.data.property.dataSource,
                }}
              />
            )
            : <Text size="sm"> The associated property has been deleted. </Text>
        }
        <div className="flex items-start mt-2">
          <Badge color="blue" size={size}>
            {discovery.data!.category.name!}
          </Badge>
        </div>
      </>
    );
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
    if (discovery.data?.dataSource) {
      body = (
        <DataSourceBody
          dataSource={{
            name: discovery.data!.dataSource.name!,
            group: discovery.data!.dataSource.group,
            properties: discovery.data!.dataSource.properties?.map((p) => ({
              name: p.name!,
            })),
          }}
          open={open}
        />
      );
    } else {
      body = <Text size="sm" className="mt-2">Data Source not found</Text>;
    }
  } else if (discovery.type === 'PROPERTY_FOUND') {
    title = 'New Property Found';
    body = (
      <PropertyBody property={discovery!.data!} />
    );
  } else if (discovery.type === 'PROPERTY_MISSING') {
    title = 'Property Deleted';
    if (discovery.data?.property) {
      body = (
        <PropertyBody property={{
          name: discovery.data.property.name!,
          dataSourceId: discovery.data.property.dataSource?.id!,
          dataSource: discovery.data.property.dataSource,
        }}
        />
      );
    } else {
      body = <Text size="sm" className="mt-2"> Could not find Property </Text>;
    }
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

  let chevronClasses = '';
  switch (size) {
    case 'sm':
      chevronClasses = 'w-5 h-5';
      break;
    case 'md':
    default:
      chevronClasses = 'w-6 h-6';
      break;
  }

  return (
    <li>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="block hover:bg-gray-50 cursor-pointer"
        onClick={() => {
          if (!onClick) {
            setOpen(!open);
            return;
          }

          onClick();
        }}
        onKeyDown={
          (ev) => {
            if (ev.key === 'ArrowDown') {
              if (!onClick) {
                setOpen(!open);
                return;
              }

              onClick();
            }
          }
        }
      >
        <div className="px-4 py-4 sm:px-6 flex items-center">
          <div className="flex flex-col flex-1 mr-10">
            <div className="flex items-center space-x-2">
              {!hideStatus && !showSiloDefinition && statusIcon}
              {showSiloDefinition
                && (
                  <>
                    {discovery.siloDefinition?.siloSpecification?.logo
                      && (
                        <SVGText
                          className="w-4 h-4"
                          imageText={discovery.siloDefinition.siloSpecification.logo}
                          alt={`${discovery.siloDefinition.siloSpecification.name} Logo`}
                        />
                      )}
                    <Text em="bold" className="text-gray-400">
                      {discovery.siloDefinition?.name}
                    </Text>
                    <SolidChevronRightIcon className="w-4 h-4" />
                  </>
                )}

              <Text
                em="bold"
              >
                {title}
              </Text>
              {!hideStatus && showSiloDefinition && statusIcon}
            </div>
            {body}
            {
              !hideActions && discovery.status === 'OPEN'
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
            <Text em="light" size={size === 'md' ? 'sm' : 'xs'}>
              {dayjs(discovery.createdAt).fromNow()}
            </Text>
            <Text em="light" className="ml-2">
              {
                open ? <ChevronDownIcon className={chevronClasses} />
                  : <ChevronRightIcon className={chevronClasses} />
              }
            </Text>
          </div>
        </div>
      </div>
    </li>
  );
}

DiscoveryItem.defaultProps = {
  hideActions: false,
  hideStatus: false,
  size: 'md',
  onClick: undefined,
  showSiloDefinition: false,
};

export default DiscoveryItem;
