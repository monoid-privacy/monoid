import { gql, useMutation } from '@apollo/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import RequestForm from './components/RequestForm';

const CREATE_NEW_REQUEST = gql`
  mutation CreateRequest($input: UserDataRequestInput!) {
    createUserDataRequest(input: $input) {
      id
    }
  }
`;

export default function NewRequestPage() {
  const { id } = useParams<{ id: string }>();

  const [createRequest, createRequestRes] = useMutation(CREATE_NEW_REQUEST);

  return (
    <>
      <PageHeader title="New Request" />
      <Card className="mt-5">
        <RequestForm
          onSubmit={(req) => {
            createRequest({
              variables: {
                input: {
                  primaryKeys: req.primaryKeys,
                  workspaceID: id,
                  type: req.type,
                },
              },
            });
          }}
          loading={createRequestRes.loading}
          error={createRequestRes.error}
        />
      </Card>
    </>
  );
}
