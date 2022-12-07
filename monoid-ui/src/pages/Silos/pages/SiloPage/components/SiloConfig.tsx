import React, { useContext, useRef } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import AlertRegion from '../../../../../components/AlertRegion';
import Spinner from '../../../../../components/Spinner';
import { SiloDefinition } from '../../../../../lib/models';
import SiloForm from '../../NewSiloPage/components/SiloForm';
import Card, { CardDivider, CardHeader } from '../../../../../components/Card';
import ToastContext from '../../../../../contexts/ToastContext';

const GET_SILO_CONFIG = gql`
  query GetSiloConfig($id: ID!) {
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
`;

const UPDATE_SILO = gql`
  mutation UpdateSilo($input: UpdateSiloDefinitionInput!) {
    updateSiloDefinition(input: $input) {
      id
    }
  }
`;

export default function SiloConfig() {
  const { siloId } = useParams<{ siloId: string }>();
  const controller = useRef(new AbortController());
  const { data, loading, error } = useQuery<{
    siloDefinition: SiloDefinition
  }>(GET_SILO_CONFIG, {
    variables: {
      id: siloId,
    },
  });
  const toastCtx = useContext(ToastContext);

  const [updateSilo, updateSiloRes] = useMutation(UPDATE_SILO, {
    context: {
      fetchOptions: {
        signal: controller.current.signal,
      },
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

  return (
    <Card>
      <CardHeader>
        Silo Settings
      </CardHeader>
      <CardDivider />
      <SiloForm
        defaultSilo={data?.siloDefinition}
        onCancel={() => {
          controller.current.abort();
          updateSiloRes.reset();
          toastCtx.showToast({
            title: 'Cancelled',
            message: 'Successfully cancelled update.',
            icon: ExclamationCircleIcon,
            variant: 'success',
          });
          controller.current = new AbortController();
        }}
        onSubmit={(val) => {
          updateSilo({
            variables: {
              input: {
                id: siloId,
                name: val.name,
                siloData: JSON.stringify(val.siloData),
              },
            },
          }).then(() => {
            toastCtx.showToast({
              title: 'Updated',
              message: 'Successfully updated config.',
              icon: CheckCircleIcon,
              variant: 'success',
            });
          }).catch(() => { });
        }}
        loading={updateSiloRes.loading}
        error={updateSiloRes.error}
      />
    </Card>
  );
}
