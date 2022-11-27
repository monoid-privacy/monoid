import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
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
        apiIdentifier
      }
    }
  }
}
`;

export default function PrimaryKeyValues() {
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
      tableCols={[
        {
          header: 'Key',
          key: 'key',
        },
        {
          header: 'Identifier',
          key: 'id',
        },
        {
          header: 'Value',
          key: 'value',
        },
      ]}
      tableRows={request?.primaryKeyValues?.map((pk) => ({
        key: pk.id!,
        columns: [
          {
            key: 'key',
            content: (
              <div className="flex">
                {pk.userPrimaryKey?.name}
              </div>
            ),
          },
          {
            key: 'id',
            content: pk.userPrimaryKey?.apiIdentifier,
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
