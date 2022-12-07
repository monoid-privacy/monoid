import React, { useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import useQuery from '../../../../../hooks/useQueryPatched';

import AlertRegion from '../../../../../components/AlertRegion';
import Spinner from '../../../../../components/Spinner';
import Table from '../../../../../components/Table';
import { Request } from '../../../../../lib/models';
import Badge from '../../../../../components/Badge';
import Pagination from '../../../../../components/Pagination';
import { GET_REQUESTS } from '../../../../../graphql/requests_queries';
import { StatusBadge } from '../../RequestPage/components/RequestStatuses';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function RequestList() {
  const { id } = useParams<{ id: string }>();
  const [offset, setOffset] = useState(0);

  const {
    data, loading, error, fetchMore,
  } = useQuery<{
    workspace: {
      requests: {
        requests: Request[],
        numRequests: number
      }
    }
  }>(GET_REQUESTS, {
    variables: {
      id,
      limit: 10,
      offset,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
  });
  const navigate = useNavigate();

  if (error) {
    return (
      <div>
        <AlertRegion alertTitle="Error loading silos">
          {error.message}
        </AlertRegion>
      </div>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <Table
      tableCols={[
        {
          header: 'Name',
          key: 'name',
        },
        {
          header: 'Created',
          key: 'created_at',
        },
        {
          header: 'Request Type',
          key: 'request_type',
        },
        {
          header: 'Status',
          key: 'request_status',
        },
      ]}
      tableRows={
        data?.workspace.requests.requests.map((req) => ({
          key: req.id!,
          onClick: () => {
            navigate(req.id!);
          },
          columns: [
            {
              key: 'name',
              content: req.id,
            },
            {
              key: 'createdAt',
              content: dayjs(req.createdAt).fromNow(),
            },
            {
              key: 'silo_type',
              content: (
                <Badge color={req.type === 'QUERY' ? 'blue' : 'red'}>
                  {req.type === 'QUERY' ? 'Query' : 'Delete'}
                </Badge>
              ),
            },
            {
              key: 'request_status',
              content: (
                <StatusBadge status={req.status!} />
              ),
            },
          ],
        }
        ))
      }
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
          totalCount={data?.workspace.requests.numRequests || 0}
        />
      )}
    />
  );
}
