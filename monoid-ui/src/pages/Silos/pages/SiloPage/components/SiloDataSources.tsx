import React, { useContext, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import {
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import { useMutation, useQuery } from '@apollo/client';
import AlertRegion from 'components/AlertRegion';
import Spinner from 'components/Spinner';
import { SiloDefinition, DataSource } from 'lib/models';
import { SILO_DATA_SOURCES } from 'graphql/silo_queries';
import Button from 'components/Button';
import Modal, { ModalBodyComponent, ModalFooterComponent } from 'components/Modal';
import { Dialog } from '@headlessui/react';
import { gql } from '__generated__';
import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardHeader } from '../../../../../components/Card';
import ScanButtonRegion from './ScanButton';
import DataSourcesTable from './DataSourcesTable';
import DataSourceForm from './DataSourceForm';

const CREATE_DATA_SOURCE = gql(`
  mutation CreateDataSource($input: CreateDataSourceInput!) {
    createDataSource(input: $input) {
      id
      name
      group
      properties {
        id
        name
        categories {
          id
          name
        }
      }
    }
  }
`);

function NewSourceModal() {
  const [dataSource, setDataSource] = useState<DataSource>({
    name: '',
    properties: [],
  });
  const { siloId } = useParams<{ siloId: string }>();

  const [createDataSource, createDataSourceRes] = useMutation(CREATE_DATA_SOURCE);

  return (
    <>
      <ModalBodyComponent>
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
          New Data Source
        </Dialog.Title>
        <div className="mt-3">
          <DataSourceForm onChange={(ds) => setDataSource(ds)} value={dataSource} />
        </div>
      </ModalBodyComponent>
      <ModalFooterComponent>
        <Button onClick={() => {
          createDataSource({
            variables: {
              input: {
                siloDefinitionID: siloId!,
                name: dataSource.name || '',
                group: null,
                properties: dataSource.properties?.map((p) => ({
                  name: p.name!,
                  categoryIDs: p.categories?.map((c) => c.id!) || [],
                })) || [],
              },
            },
          });
        }}
        >
          {createDataSourceRes.loading ? <Spinner /> : 'Submit'}
        </Button>
      </ModalFooterComponent>
    </>
  );
}

export default function SiloDataSources(props: {
  newOpen?: boolean
}) {
  const toastCtx = useContext(ToastContext);
  const navigate = useNavigate();
  const { id, siloId } = useParams<{ id: string, siloId: string }>();
  const {
    data, loading, error, refetch,
  } = useQuery(SILO_DATA_SOURCES, {
    variables: {
      id: siloId!,
    },
  });
  const { newOpen } = props;

  if (loading) {
    return (
      <div className="md:px-6 md:-mt-6 px-4 -mt-5 md:pb-6 pb-4" />
    );
  }

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  return (
    <>
      <Modal open={newOpen || false} setOpen={() => navigate('..')} size="lg">
        <NewSourceModal />
      </Modal>

      <Card
        innerClassName="py-0 px-0 sm:p-0"
        className="overflow-hidden"
      >
        <CardHeader className="flex items-center px-4 sm:px-6 py-5 sm:py-6">
          Sources
          <div className="ml-auto">

            {
              !data?.siloDefinition.siloSpecification?.manual
                ? (
                  <ScanButtonRegion
                    siloId={siloId!}
                    workspaceId={id!}
                    onScanStatusChange={(s) => {
                      if (s === 'COMPLETED') {
                        refetch();
                        toastCtx.showToast({
                          variant: 'success',
                          title: 'Scan Complete',
                          message: 'Data silo scan has finished.',
                          icon: ExclamationCircleIcon,
                        });
                      }
                    }}
                  >
                    Scan
                  </ScanButtonRegion>
                )
                : (
                  <Button to="new" type="link">
                    New Data Source
                  </Button>
                )
            }
          </div>

        </CardHeader>
        {
          !loading
            ? <DataSourcesTable siloDef={data?.siloDefinition as SiloDefinition} type="plain" />
            : <Spinner />
        }
      </Card>
    </>
  );
}

SiloDataSources.defaultProps = {
  newOpen: false,
};
