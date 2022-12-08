import { useQuery } from '@apollo/client';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import AlertRegion from '../../../components/AlertRegion';
import Button from '../../../components/Button';
import Card, { CardDivider, CardHeader } from '../../../components/Card';
import Spinner from '../../../components/Spinner';
import Table from '../../../components/Table';
import { GET_REQUESTS } from '../../../graphql/requests_queries';
import { Request } from '../../../lib/models';
import Badge from '../../../components/Badge';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

function RequestsCardBody() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_REQUESTS, {
    variables: {
      id,
      limit: 5,
      offset: 0,
    },
  });
  const navigate = useNavigate();

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
    <Table
      className="flex-1"
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
      ]}
      tableRows={
        data?.workspace.requests.requests.map((req: Request) => ({
          key: req.id!,
          onClick: () => {
            navigate(`../requests/${req.id!}`);
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
              key: 'request_type',
              content: (
                <Badge color={req.type === 'QUERY' ? 'blue' : 'red'}>
                  {req.type === 'QUERY' ? 'Query' : 'Delete'}
                </Badge>
              ),
            },
          ],
        }
        ))
      }
    />
  );
}

export default function RequestsCard() {
  return (
    <Card className="flex-1 h-[30rem]" innerClassName="flex flex-col h-full">
      <CardHeader>
        Recent Data Requests
      </CardHeader>
      <CardDivider />
      <RequestsCardBody />
      <CardDivider />
      <div className="flex">
        <Button type="link" to="../requests" variant="outline-white" className="ml-auto">
          View All
        </Button>
      </div>
    </Card>
  );
}
