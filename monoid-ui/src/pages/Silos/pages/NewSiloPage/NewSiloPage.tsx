import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../../components/PageHeader';
import ToastContext from '../../../../contexts/ToastContext';
import NewSiloForm from './components/NewSiloForm';

export default function NewSiloPage() {
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);

  return (
    <>
      <PageHeader title="New Silo" className="mb-5" />
      <NewSiloForm
        onSuccess={(sd) => {
          navigate(`../${sd.id}`);
        }}
        onError={() => { }}
        onCancel={() => {
          toastCtx.showToast({
            title: 'Cancelled',
            message: 'Cancelled successfully.',
            icon: ExclamationCircleIcon,
            variant: 'success',
          });
        }}
      />
    </>
  );
}
