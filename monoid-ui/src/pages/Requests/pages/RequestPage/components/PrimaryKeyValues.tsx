import React from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { gql } from '__generated__/gql';
import Table from '../../../../../components/Table';
import Spinner from '../../../../../components/Spinner';
import AlertRegion from '../../../../../components/AlertRegion';

const PRIMARY_KEY_VALUES = gql(`
query GetPrimaryKeyValues($id: ID!) {
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
`);

export default function PrimaryKeyValues() {
  const { requestId } = useParams<{ requestId: string, id: string }>();
  const { data, loading, error } = useQuery(PRIMARY_KEY_VALUES, {
    variables: {
      id: requestId!,
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
