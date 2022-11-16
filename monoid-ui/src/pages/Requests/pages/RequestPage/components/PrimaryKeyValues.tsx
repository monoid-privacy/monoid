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

export default function PrimaryKeyValues() {
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
          header: 'Key',
          key: 'key',
        },
        {
          header: 'Value',
          key: 'value',
        },
      ]}
      tableRows={request?.primaryKeyValues?.map((pk) => ({
        key: pk.id!,
        onClick: () => {
          navigate(pk.id!);
        },
        columns: [
          {
            key: 'id',
            content: pk.id,
          },
          {
            key: 'key',
            content: (
              <div className="flex">
                {pk.userPrimaryKey?.name}
              </div>
            ),
          },
          {
            key: 'value',
            content: (
              <div className="flex">
                {pk.value}
              </div>
            ),
          },
        ],
      }
      ))}
    />
  );
}
