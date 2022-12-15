import { useQuery } from '@apollo/client';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AlertRegion from '../../../../components/AlertRegion';
import Button from '../../../../components/Button';
import PageHeader from '../../../../components/PageHeader';
import Spinner from '../../../../components/Spinner';
import Table from '../../../../components/Table';
import { GET_PRIMARY_KEYS } from '../../../../graphql/requests_queries';
import { UserPrimaryKey } from '../../../../lib/models';

function UserIdentifiersBody() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      userPrimaryKeys: UserPrimaryKey[],
    },
  }>(GET_PRIMARY_KEYS, {
    variables: {
      id,
    },
  });

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
      tableCols={[
        {
          header: 'Name',
          key: 'name',
        },
        {
          header: 'Identifier',
          key: 'apiIdentifier',
        },
      ]}
      tableRows={
        data?.workspace.userPrimaryKeys.map((v) => ({
          key: v.id!,
          columns: [
            {
              content: v.name,
              key: 'name',
            },
            {
              content: v.apiIdentifier,
              key: 'apiIdentifier',
            },
          ],
        }))
      }
    />
  );
}

export default function UserIdentifiersList() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="User Identifiers"
        actionItem={(
          <Button onClick={() => navigate('new')}>
            New Identifier
          </Button>
        )}
      />
      <UserIdentifiersBody />
    </>
  );
}
