import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApolloError, gql, useMutation } from '@apollo/client';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Input, { InputLabel } from '../../../../components/Input';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import Text from '../../../../components/Text';
import ToastContext from '../../../../contexts/ToastContext';

const CREATE_PRIMARY_KEY = gql`
  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {
    createUserPrimaryKey(input: $input) {
      id
    }
  }
`;

export default function NewPrimaryKeyPage() {
  const { id } = useParams<{ id: string }>();
  const [pk, setPk] = useState({
    name: '',
    apiIdentifier: '',
  });
  const [mutateFunction, res] = useMutation(CREATE_PRIMARY_KEY);
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);

  return (
    <>
      <PageHeader title="New Identifier" />
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
                navigate('..');
              }).catch((err: ApolloError) => {
                toastCtx.showToast(
                  {
                    title: 'Error Creating Identifier',
                    message: err.message,
                    variant: 'danger',
                    icon: XCircleIcon,
                  },
                );
              });
            }}
          >
            {res.loading ? <Spinner /> : 'Submit'}
          </Button>
        </div>
      </Card>
    </>
  );
}
