import React, { useContext, useMemo, useState } from 'react';
import {
  ApolloError, useMutation, useQuery,
} from '@apollo/client';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CircleStackIcon, FolderIcon, PlusIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { gql } from '__generated__/gql';
import Table from '../../../../../components/Table';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import { QueryResult, SiloDefinition } from '../../../../../lib/models';
import Badge, { BadgeColor } from '../../../../../components/Badge';
import SVGText from '../../../../../components/SVGText';
import Pagination from '../../../../../components/Pagination';
import FilterRegion, { FilterValue } from '../../../../../components/FilterRegion';
import { SiloDefTag } from '../../../../DataMap/DataMapPage';
import Button from '../../../../../components/Button';
import ToastContext from '../../../../../contexts/ToastContext';

const FILTER_OPTIONS_QUERY = gql(`
  query RequestFilterOptionsQuery($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloDefinitions {
        id
        name
        siloSpecification {
          id
          logo
        }
      }
    }
  }
`);

const GET_REQUEST_DATA = gql(`
query GetRequestData($id: ID!, $limit: Int!, $offset: Int!, $query: RequestStatusQuery!) {
  request(id: $id) {
    id
    type
    requestStatuses(offset: $offset, limit: $limit, query: $query) {
      numStatuses
      requestStatusRows {
        id
        status
        dataSource {
          id
          name
          group
          siloDefinition {
            id
            name
            siloSpecification {
              id
              name
              logo
            }
          }
        }
        queryResult {
          id
          records
          resultType
        }
      }
    }
  }
}
`);

const GET_QUERY_RESULT_FILE = gql(`
  mutation GetQueryResultFile($id: ID!) {
    generateQueryResultDownloadLink(queryResultId: $id) {
      url
    }
  }
`);

export function StatusBadge({ status }: { status: string }) {
  let disp = status;
  let badgeColor: BadgeColor = 'blue';

  switch (status) {
    case 'CREATED':
      disp = 'Created';
      break;
    case 'FAILED':
      disp = 'Failed';
      badgeColor = 'red';
      break;
    case 'PARTIAL_FAILED':
      disp = 'Partially Failed';
      badgeColor = 'yellow';
      break;
    case 'IN_PROGRESS':
      disp = 'In Progress';
      badgeColor = 'blue';
      break;
    case 'EXECUTED':
      disp = 'Executed';
      badgeColor = 'green';
      break;
    default:
  }

  return <Badge color={badgeColor}>{disp}</Badge>;
}

function Filters(props: {
  onChange: (v: FilterValue[]) => void,
  value: FilterValue[]
}) {
  const { onChange, value } = props;
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(FILTER_OPTIONS_QUERY, {
    variables: {
      workspaceId: id!,
    },
  });

  if (error) {
    return (
      <AlertRegion alertTitle="Error loading filters">
        {error.message}
      </AlertRegion>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  const siloDefFormat = (v: FilterValue) => (
    <SiloDefTag siloDefs={(data?.workspace.siloDefinitions || []) as SiloDefinition[]} value={v} />
  );

  return (
    <FilterRegion
      filterOptions={[{
        name: 'Data Silos',
        options: data?.workspace.siloDefinitions.map((d) => ({
          key: d.id!,
          content: d.name,
        })) || [],
        formatTag: siloDefFormat,
      }]}
      onChange={onChange}
      value={value}
    >
      <div className="flex items-center space-x-1">
        <div>
          Filters
        </div>
        <PlusIcon className="h-5 w-5" />
      </div>
    </FilterRegion>

  );
}

function RecordCell(props: { queryResult: QueryResult }) {
  const { queryResult } = props;
  const toastCtx = useContext(ToastContext);
  const [genLink, genLinkRes] = useMutation(GET_QUERY_RESULT_FILE, {
    variables: {
      id: queryResult.id!,
    },
  });

  return (
    <td colSpan={4} className="overflow-hidden">
      {
        queryResult.resultType === 'RECORDS_JSON' ? (
          <pre className="text-xs bg-gray-100 p-4">
            {JSON.stringify(JSON.parse(queryResult.records || ''), null, 2)}
          </pre>
        )
          : (
            <div className="p-4">
              <Button onClick={() => {
                genLink().then(({ data }) => {
                  const urlStr = (process.env.REACT_APP_API_URL || '') + data!.generateQueryResultDownloadLink.url;
                  const url = new URL(urlStr, window.location.origin);

                  window.open(url, '_blank');
                }).catch((err: ApolloError) => {
                  toastCtx.showToast({
                    title: 'Error',
                    message: err.message,
                    variant: 'danger',
                    icon: XCircleIcon,
                  });
                });
              }}
              >
                {genLinkRes.loading ? <Spinner color="white" /> : 'Download File'}
              </Button>
            </div>
          )
      }
    </td>
  );
}

export default function RequestStatuses() {
  const { requestId } = useParams<{ id: string, requestId: string }>();
  const [offset, setOffset] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();

  const setFilters = (val: FilterValue[]) => {
    const params = new URLSearchParams();

    const filterMap = Object.fromEntries(
      val.map((f) => [f.name, f.value]),
    );

    Object.keys(filterMap).forEach((k) => {
      filterMap[k].forEach((v) => {
        params.append(k, v);
      });
    });

    setSearchParams(params);
  };

  const filters = useMemo(() => {
    const parsedFilters: FilterValue[] = [];
    const dataSilo = searchParams.getAll('Data Silos');

    if (dataSilo.length !== 0) {
      parsedFilters.push({
        name: 'Data Silos',
        value: dataSilo,
      });
    }

    return parsedFilters;
  }, [searchParams]);

  const query = useMemo(() => {
    const filterVars: {
      siloDefinitions?: string[]
    } = {
      siloDefinitions: [],
    };

    filters.forEach((v) => {
      if (v.name === 'Data Silos') {
        filterVars.siloDefinitions = v.value;
      }
    });

    return filterVars;
  }, [filters]);

  const {
    data, loading, error, fetchMore,
  } = useQuery(GET_REQUEST_DATA, {
    variables: {
      id: requestId!,
      limit: 10,
      offset,
      query,
    },
  });

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

  const request = data?.request;
  return (
    <>
      <Filters onChange={setFilters} value={filters} />
      <Table
        nested
        tableCols={[
          {
            header: 'Data Silo',
            key: 'silo',
          },
          {
            header: 'Data Source',
            key: 'data_source',
          },
          {
            header: 'Status',
            key: 'status',
          },
        ]}
        tableRows={request?.requestStatuses?.requestStatusRows?.map((req) => ({
          key: req.id!,
          nestedComponent: req.queryResult && (
            <tr>
              <RecordCell queryResult={req.queryResult as QueryResult} />
            </tr>
          ),
          columns: [
            {
              key: 'silo',
              content: (
                <div className="flex space-x-2 items-center">
                  {req.dataSource?.siloDefinition?.siloSpecification?.logo
                    && (
                      <SVGText
                        className="w-4 h-4"
                        imageText={req.dataSource.siloDefinition.siloSpecification.logo}
                        alt={`${req.dataSource.siloDefinition.siloSpecification.name} Logo`}
                      />
                    )}
                  <div>
                    {req?.dataSource.siloDefinition.name}
                  </div>
                </div>
              ),
            },
            {
              key: 'data_source',
              content: (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-1">
                    <CircleStackIcon className="w-4 h-4" />
                    <div>{req.dataSource.name}</div>
                  </div>
                  {req.dataSource.group
                    && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <FolderIcon className="w-4 h-4" />
                        <div>{req.dataSource.group}</div>
                      </div>
                    )}
                </div>
              ),
            },
            {
              key: 'status',
              content: (
                <div className="flex flex-wrap space-x-1">
                  <StatusBadge status={req.status!} />
                  {req.queryResult && (
                    <Badge>
                      Has Data
                    </Badge>
                  )}
                </div>
              ),
            },
          ],
        }
        ))}
        footer={(
          <Pagination
            limit={10}
            offset={offset}
            onOffsetChange={(o) => {
              fetchMore({
                variables: {
                  offset: o,
                },
              }).then(() => {
                setOffset(o);
              });
            }}
            totalCount={request?.requestStatuses.numStatuses || 0}
          />
        )}
      />
    </>
  );
}
