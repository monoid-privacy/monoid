import React, { useState } from 'react';
import Input, { InputLabel } from 'components/Input';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import Card from 'components/Card';
import Text from 'components/Text';
import { ApolloError, gql, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';

const CREATE_PRIMARY_KEY = gql`
  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {
    createUserPrimaryKey(input: $input) {
      id
    }
  }
`;

export default function NewPrimaryKeyForm(props: {
  onSuccess: () => void
  onError: (error: ApolloError) => void
}) {
  const [mutateFunction, res] = useMutation(CREATE_PRIMARY_KEY);
  const [pk, setPk] = useState({
    name: '',
    apiIdentifier: '',
  });
  const { id } = useParams<{ id: string }>();
  const { onSuccess, onError } = props;

  return (
    <Card>
      <div className="flex-col space-y-3">
        <div>
          <InputLabel className="mb-2">
            Descriptive Name
          </InputLabel>
          <Input
            value={pk.name}
            onChange={(v) => {
              setPk({ ...pk, name: v.target.value });
            }}
          />
          <Text size="sm" em="light" className="mt-2">
            This name will show up on the UI to describe the identifier.
          </Text>
        </div>
        <div>
          <InputLabel className="mb-2">
            Unique ID
          </InputLabel>
          <Input
            value={pk.apiIdentifier}
            onChange={(v) => {
              setPk({ ...pk, apiIdentifier: v.target.value });
            }}
          />
          <Text size="sm" em="light" className="mt-2">
            You can use this ID to create requests through the API.
            Must be unique across the workspace.
          </Text>
        </div>
        <Button
          onClick={() => {
            mutateFunction({
              variables: {
                input: {
                  workspaceId: id,
                  name: pk.name,
                  apiIdentifier: pk.apiIdentifier,
                },
              },
            }).then(() => {
              onSuccess();
            }).catch((err: ApolloError) => {
              onError(err);
            });
          }}
        >
          {res.loading ? <Spinner /> : 'Submit'}
        </Button>
      </div>
    </Card>
  );
}
