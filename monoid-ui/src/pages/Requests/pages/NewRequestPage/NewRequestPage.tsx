import { gql, useMutation, useQuery } from '@apollo/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import RequestForm from './components/RequestForm';
import { UserPrimaryKey } from '../../../../lib/models';
import Spinner from '../../../../components/Spinner';
import AlertRegion from '../../../../components/AlertRegion';

const CREATE_NEW_REQUEST = gql`
  mutation CreateRequest($input: UserDataRequestInput!) {
    createUserDataRequest(input: $input) {
      id
    }
  }
`;

const GET_PRIMARY_KEYS = gql`
  query GetPrimaryKeys($id: ID!) {
    workspace(id: $id) {
      userPrimaryKeys {
        id 
        name
      }
    }
  }
  `;

export default function NewRequestPage() {
  const { id } = useParams<{ id: string }>();

  const [createRequest, createRequestRes] = useMutation(CREATE_NEW_REQUEST);
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
      <AlertRegion
        alertTitle="Error"
      >
        {error.message}
      </AlertRegion>
    );
  }

  if (!data) {
    return (
      <AlertRegion
        alertTitle="Error"
      >
        Data undefined
      </AlertRegion>
    );
  }

  return (
    <>
      <PageHeader title="New Request" />
      <Card className="mt-5">
        <RequestForm
          userPrimaryKeys={data.workspace.userPrimaryKeys}
          onSubmit={(req) => {
            console.log(req);
            createRequest({
              variables: {
                input: {
                  primaryKeys: req.primaryKeys,
                  workspaceId: id,
                  type: req.type,
                },
              },
            });
          }}
          formLoading={createRequestRes.loading}
          formError={createRequestRes.error}
        />
      </Card>
    </>
  );
}
