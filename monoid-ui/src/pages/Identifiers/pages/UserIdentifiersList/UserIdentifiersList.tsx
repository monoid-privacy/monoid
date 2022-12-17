import { useQuery } from '@apollo/client';
import { IdentificationIcon } from '@heroicons/react/24/outline';
import Card from 'components/Card';
import EmptyState from 'components/Empty';
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

  if ((data?.workspace.userPrimaryKeys.length || 0) === 0) {
    return (
      <Card>
        <EmptyState
          icon={IdentificationIcon}
          title="No User Identifiers"
          subtitle="No user identifiers were found in this workspace."
          className="py-7"
          action={<Button type="link" to="new">New Identifier</Button>}
        />
      </Card>
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
