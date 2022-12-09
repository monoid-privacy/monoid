import React, { useContext } from 'react';

import { useParams } from 'react-router-dom';
import {
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import { useQuery } from '@apollo/client';
import AlertRegion from 'components/AlertRegion';
import Spinner from 'components/Spinner';
import { SiloDefinition } from 'lib/models';
import { SILO_DATA_SOURCES } from 'graphql/silo_queries';
import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardHeader } from '../../../../../components/Card';
import ScanButtonRegion from './ScanButton';
import DataSourcesTable from './DataSourcesTable';

export default function SiloDataSources() {
  const toastCtx = useContext(ToastContext);
  const { id, siloId } = useParams<{ id: string, siloId: string }>();
  const {
    data, loading, error, refetch,
  } = useQuery<{ siloDefinition: SiloDefinition }>(SILO_DATA_SOURCES, {
    variables: {
      id: siloId,
    },
  });

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
    <Card
      innerClassName="py-0 px-0 sm:p-0"
      className="overflow-hidden"
    >
      <CardHeader className="flex items-center px-4 sm:px-6 py-5 sm:py-6">
        Sources
        <div className="ml-auto">
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
        </div>
      </CardHeader>
      {!loading
        ? <DataSourcesTable siloDef={data?.siloDefinition} type="plain" />
        : <Spinner />}
    </Card>
  );
}
