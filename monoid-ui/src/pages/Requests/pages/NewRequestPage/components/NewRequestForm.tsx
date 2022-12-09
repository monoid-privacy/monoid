import { ApolloError, gql, useMutation } from '@apollo/client';
import { XCircleIcon } from '@heroicons/react/24/outline';
import ToastContext from 'contexts/ToastContext';
import React, { useContext } from 'react';
import { Request } from 'lib/models';
import { useParams } from 'react-router-dom';
import RequestForm from './RequestForm';

const CREATE_NEW_REQUEST = gql`
  mutation CreateRequest($input: UserDataRequestInput!) {
    createUserDataRequest(input: $input) {
      id
    }
  }
`;

export default function NewRequestForm(props: {
  onSuccess: (req: Request) => void,
  actionName?: string,
}) {
  const [createRequest, createRequestRes] = useMutation(CREATE_NEW_REQUEST);
  const { onSuccess, actionName } = props;
  const toastCtx = useContext(ToastContext);
  const { id } = useParams<{ id: string }>();

  return (
    <RequestForm
      actionName={actionName}
      onSubmit={(req) => {
        createRequest({
          variables: {
            input: {
              primaryKeys: req.primaryKeys,
              workspaceId: id,
              type: req.type,
            },
          },
        }).then(({ data }) => {
          onSuccess(data.createUserDataRequest);
        }).catch((err: ApolloError) => {
          toastCtx.showToast(
            {
              title: 'Error Creating Request',
              message: err.message,
              variant: 'danger',
              icon: XCircleIcon,
            },
          );
        });
      }}
      formLoading={createRequestRes.loading}
      formError={createRequestRes.error}
    />
  );
}

NewRequestForm.defaultProps = {
  actionName: undefined,
};
