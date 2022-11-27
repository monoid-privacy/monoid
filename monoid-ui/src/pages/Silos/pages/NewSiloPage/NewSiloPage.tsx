import { gql, useMutation } from '@apollo/client';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import React, { useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import ToastContext from '../../../../contexts/ToastContext';
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
  const navigate = useNavigate();
  const controller = useRef(new AbortController());
  const toastCtx = useContext(ToastContext);

  const [createSilo, createSiloRes] = useMutation(CREATE_NEW_SILO, {
    context: {
      fetchOptions: {
        signal: controller.current.signal,
      },
    },
  });

  return (
    <>
      <PageHeader title="New Silo" />
      <Card className="mt-5">
        <SiloForm
          onCancel={() => {
            controller.current.abort();
            createSiloRes.reset();
            toastCtx.showToast({
              title: 'Cancelled',
              message: 'Cancelled successfully.',
              icon: ExclamationCircleIcon,
              variant: 'success',
            });
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
            }).then(({ data }) => navigate(`../${data.createSiloDefinition.id}`)).catch(() => { });
          }}
          loading={createSiloRes.loading}
          error={createSiloRes.error}
        />
      </Card>
    </>
  );
}
