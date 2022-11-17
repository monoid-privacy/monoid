import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { CircleStackIcon, FolderIcon } from '@heroicons/react/24/outline';
import Table from '../../../../../components/Table';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import { Request } from '../../../../../lib/models';
import Badge, { BadgeColor } from '../../../../../components/Badge';

const GET_REQUEST_DATA = gql`
query GetRequestData($id: ID!) {
  request(id: $id) {
    id
    type
    primaryKeyValues {
      id
      value
      userPrimaryKey {
        id
        name
      }
    }
    requestStatuses {
      id
      status
      dataSource {
        id
        name
        group
        siloDefinition {
          id
          name
        }
      }
      queryResult {
        id
        records
      }
    }
  }
}
`;

function StatusBadge({ status }: { status: string }) {
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
    case 'EXECUTED':
      disp = 'Executed';
      badgeColor = 'green';
      break;
    default:
  }

  return <Badge color={badgeColor}>{disp}</Badge>;
}
export default function RequestStatuses() {
  const { requestId } = useParams<{ requestId: string }>();
  const { data, loading, error } = useQuery<{
    request: Request
  }>(GET_REQUEST_DATA, {
    variables: {
      id: requestId,
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
      tableRows={request?.requestStatuses?.map((req) => ({
        key: req.id!,
        nestedComponent: req.queryResult && (
          <tr>
            <td colSpan={4} className="overflow-hidden">
              <pre className="text-xs bg-gray-100 p-4">
                {JSON.stringify(JSON.parse(req.queryResult?.records || ''), null, 2)}
              </pre>
            </td>
          </tr>
        ),
        columns: [
          {
            key: 'silo',
            content: (
              <div className="flex">
                {req?.dataSource?.siloDefinition?.name}
              </div>
            ),
          },
          {
            key: 'data_source',
            content: (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-1">
                  <CircleStackIcon className="w-4 h-4" />
                  <div>{req.dataSource?.name}</div>
                </div>
                {req.dataSource?.group
                  && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <FolderIcon className="w-4 h-4" />
                      <div>{req.dataSource?.group}</div>
                    </div>
                  )}
              </div>
            ),
          },
          {
            key: 'status',
            content: (
              <StatusBadge status={req.status!} />
            ),
          },
        ],
      }
      ))}
    />
  );
}
