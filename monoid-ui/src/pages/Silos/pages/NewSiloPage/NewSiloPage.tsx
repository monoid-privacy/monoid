import { gql, useMutation } from '@apollo/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import SiloForm from './components/SiloForm';

const CREATE_NEW_SILO = gql`
  mutation CreateSilo($input: CreateSiloDefinitionInput!) {
    createSiloDefinition(input: $input) {
      id
    }
  }
`;

export default function NewSiloPage() {
  const { id } = useParams<{ id: string }>();

  const [createSilo, createSiloRes] = useMutation(CREATE_NEW_SILO);

  return (
    <>
      <PageHeader title="New Silo" />
      <Card className="mt-5">
        <SiloForm
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
            });
          }}
          loading={createSiloRes.loading}
          error={createSiloRes.error}
        />
      </Card>
    </>
  );
}
