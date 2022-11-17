import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import AlertRegion from '../../../../../components/AlertRegion';
import Spinner from '../../../../../components/Spinner';
import { SiloDefinition } from '../../../../../lib/models';
import SiloForm from '../../NewSiloPage/components/SiloForm';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';

const GET_SILO_CONFIG = gql`
  query GetSiloConfig($id: ID!, $workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloDefinition(id: $id) {
        id
        name
        siloSpecification {
          id
          name
          logoUrl
        }
        siloConfig
      }
    }
  }
`;

const UPDATE_SILO = gql`
  mutation UpdateSilo($input: UpdateSiloDefinitionInput!) {
    updateSiloDefinition(input: $input) {
      id
    }
  }
`;

export default function SiloConfig() {
  const { siloId, id } = useParams<{ siloId: string, id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      siloDefinition: SiloDefinition
    }
  }>(GET_SILO_CONFIG, {
    variables: {
      id: siloId,
      workspaceId: id,
    },
  });

  const [updateSilo, updateSiloRes] = useMutation(UPDATE_SILO);

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
    <Card>
      <CardHeader>
        Silo Settings
      </CardHeader>
      <CardDivider />
      <SiloForm
        defaultSilo={data?.workspace.siloDefinition}
        onSubmit={(val) => {
          updateSilo({
            variables: {
              input: {
                id: siloId,
                workspaceId: id,
                name: val.name,
                siloData: JSON.stringify(val.siloData),
              },
            },
          });
        }}
        loading={updateSiloRes.loading}
        error={updateSiloRes.error}
      />
    </Card>
  );
}
