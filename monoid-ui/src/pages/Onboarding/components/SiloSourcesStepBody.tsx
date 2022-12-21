import { useQuery } from '@apollo/client';
import { Dialog } from '@headlessui/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import AlertRegion from 'components/AlertRegion';
import Button from 'components/Button';
import Modal, { ModalBodyComponent, ModalFooterComponent } from 'components/Modal';
import PageHeader from 'components/PageHeader';
import Spinner from 'components/Spinner';
import { SILO_DATA_SOURCES } from 'graphql/silo_queries';
import { SiloDefinition } from 'lib/models';
import DataSourcesTable from 'pages/Silos/pages/SiloPage/components/DataSourcesTable';
import React, { useState } from 'react';
import Text from 'components/Text';

export default function SiloSourcesBody(props: {
  onSuccess: () => void,
  siloDefinitionId: string,
}) {
  const { onSuccess, siloDefinitionId } = props;
  const {
    data, loading, error,
  } = useQuery(SILO_DATA_SOURCES, {
    variables: {
      id: siloDefinitionId,
    },
  });
  const [modalOpen, setModalOpen] = useState(false);

  const validateIdentifiers: () => boolean = () => {
    if (loading) {
      return false;
    }

    if (error) {
      return true;
    }

    const missingSources = data?.siloDefinition.dataSources?.map((v) => {
      if (v.properties?.find((p) => p.userPrimaryKey)) {
        return undefined;
      }

      return v.id!;
    }).filter(Boolean);

    return (missingSources?.length || 0) === 0;
  };

  return (
    <>
      <Modal open={modalOpen} setOpen={setModalOpen}>
        <ModalBodyComponent>
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
            Unlinked Data Sources
          </Dialog.Title>
          <div className="mt-2">
            <Text size="sm" em="light">
              Some Data Sources are not linked to a user identifier. These data sources
              will not be able to be handled in requests.
            </Text>
          </div>
        </ModalBodyComponent>
        <ModalFooterComponent>
          <div className="flex space-x-2">
            <Button onClick={() => { onSuccess(); }}>
              Continue
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </ModalFooterComponent>
      </Modal>

      <PageHeader title="Link User Identifiers" className="mb-2" />
      <Text className="mb-4" size="sm">
        Review the data sources you just created, and link the relevant user identifiers
        to the properties they correspond to. We&apos;ll use this information to process
        right-to-know and deletion requests.
      </Text>

      <div className="flex mb-4">
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => {
            const validated = validateIdentifiers();
            if (validated) {
              onSuccess();
            } else {
              setModalOpen(true);
            }
          }}
        >
          <div className="flex items-center space-x-1">
            <div>Next</div>
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </Button>
      </div>

      {loading && <Spinner />}
      {!loading && error && <AlertRegion alertTitle="Error">{error.message}</AlertRegion>}
      {!loading && !error && <DataSourcesTable siloDef={data?.siloDefinition as SiloDefinition} type="card" />}
    </>
  );
}
