import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../../../../../components/Table';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';
import { Request } from '../../../../../lib/models';

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
      }
    }
  }
}
`;

export default function RequestStatuses() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
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
      tableCols={[
        {
          header: 'ID',
          key: 'id',
        },
        {
          header: 'Data Source Name',
          key: 'data_source_name',
        },
        {
          header: 'Data Source Group',
          key: 'data_source_group',
        },
        {
          header: 'Status',
          key: 'status',
        },
      ]}
      tableRows={request?.requestStatuses?.map((req) => ({
        key: req.id!,
        onClick: () => {
          navigate(req.id!);
        },
        columns: [
          {
            key: 'id',
            content: req.id,
          },
          {
            key: 'data_source_name',
            content: (
              <div className="flex">
                {req.dataSource?.name}
              </div>
            ),
          },
          {
            key: 'data_source_group',
            content: (
              <div className="flex">
                {req.dataSource?.group}
              </div>
            ),
          },
          {
            key: 'status',
            content: (
              <div className="flex">
                {req.status}
              </div>
            ),
          },
        ],
      }
      ))}
    />
  );
}
