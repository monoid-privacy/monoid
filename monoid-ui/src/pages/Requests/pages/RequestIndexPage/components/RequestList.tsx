import React from 'react';

import { gql, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import AlertRegion from '../../../../../components/AlertRegion';
import Spinner from '../../../../../components/Spinner';
import Table from '../../../../../components/Table';
import { Request } from '../../../../../lib/models';

const GET_REQUESTS = gql`
  query GetRequests($id: ID!) {
    workspace(id: $id) {
      requests {
        id
        type
        requestStatuses {
          id
        }
      }
    }
  }
`;

export default function RequestList() {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useQuery<{
    workspace: {
      requests: Request[]
    }
  }>(GET_REQUESTS, {
    variables: {
      id,
    },
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
          header: 'Request Type',
          key: 'request_type',
        },
      ]}
      tableRows={data?.workspace.requests.map((req) => ({
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
            key: 'silo_type',
            content: (
              <div className="flex">
                {req.type}
              </div>
            ),
          },
        ],
      }
      ))}
    />
  );
}
