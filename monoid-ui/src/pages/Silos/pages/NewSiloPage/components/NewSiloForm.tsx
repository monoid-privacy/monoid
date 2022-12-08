import { ApolloError, gql, useMutation } from '@apollo/client';
import Card from 'components/Card';
import { SiloDefinition } from 'lib/models';
import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import SiloForm from './SiloForm';

const CREATE_NEW_SILO = gql`
  mutation CreateSilo($input: CreateSiloDefinitionInput!) {
    createSiloDefinition(input: $input) {
      id
    }
  }
`;

export default function NewSiloForm(props: {
  onSuccess: (sd: SiloDefinition) => void,
  onError: (error: ApolloError) => void,
  onCancel: () => void,
}) {
  const { id } = useParams<{ id: string }>();
  const { onSuccess, onError, onCancel } = props;
  const controller = useRef(new AbortController());

  const [createSilo, createSiloRes] = useMutation(CREATE_NEW_SILO, {
    context: {
      fetchOptions: {
        signal: controller.current.signal,
      },
    },
  });

  return (
    <Card>
      <SiloForm
        onCancel={() => {
          controller.current.abort();
          createSiloRes.reset();
          onCancel();
          controller.current = new AbortController();
        }}
        onSubmit={(silo) => {
          createSilo({
            variables: {
              input: {
                name: silo.name,
                siloSpecificationID: silo.siloSpec?.id,
                workspaceID: id,
                siloData: JSON.stringify(silo.siloData),
              },
            },
          }).then(({ data }) => onSuccess(data.createSiloDefinition)).catch(
            (err: ApolloError) => { onError(err); },
          );
        }}
        loading={createSiloRes.loading}
        error={createSiloRes.error}
      />
    </Card>
  );
}
