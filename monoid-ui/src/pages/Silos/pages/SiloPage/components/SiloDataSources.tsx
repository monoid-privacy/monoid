import React, { useContext, useRef } from 'react';

import { useParams } from 'react-router-dom';
import {
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import ToastContext from '../../../../../contexts/ToastContext';
import Card, { CardHeader } from '../../../../../components/Card';
import ScanButtonRegion from './ScanButton';
import DataSourcesTable from './DataSourcesTable';

export default function SiloDataSources() {
  // eslint-disable-next-line no-spaced-func
  const tableRef = useRef<{ refetch: () => void }>();
  const toastCtx = useContext(ToastContext);
  const { id, siloId } = useParams<{ id: string, siloId: string }>();

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
                tableRef.current?.refetch();
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
      <DataSourcesTable siloId={siloId!} ref={tableRef} type="plain" />
    </Card>
  );
}
