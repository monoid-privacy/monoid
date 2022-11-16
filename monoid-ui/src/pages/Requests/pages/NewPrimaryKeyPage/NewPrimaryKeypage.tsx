import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';
import Input, { InputLabel } from '../../../../components/Input';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';

const CREATE_PRIMARY_KEY = gql`
  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {
    createUserPrimaryKey(input: $input) {
      id
    }
  }
`;

export default function NewPrimaryKeyPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [mutateFunction, res] = useMutation(CREATE_PRIMARY_KEY);

  return (
    <>
      <InputLabel>
        Key Name
      </InputLabel>
      <Input
        value={name}
        onChange={(v) => {
          setName(v.target.value);
        }}
      />
      <Button
        onClick={() => {
          mutateFunction({
            variables: {
              input: {
                workspaceId: id,
                name,
              },
            },
          });
        }}
      >
        {res.loading ? <Spinner /> : 'Submit'}
      </Button>

    </>
  );
}
