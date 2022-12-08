import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from 'components/PageHeader';
import ToastContext from 'contexts/ToastContext';
import { XCircleIcon } from '@heroicons/react/24/outline';
import NewPrimaryKeyForm from './components/NewPrimaryKeyForm';

export default function NewPrimaryKeyPage() {
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);

  return (
    <>
      <PageHeader title="New Identifier" />
      <NewPrimaryKeyForm
        onSuccess={() => {
          navigate('..');
        }}
        onError={(err) => {
          toastCtx.showToast(
            {
              title: 'Error Creating Identifier',
              message: err.message,
              variant: 'danger',
              icon: XCircleIcon,
            },
          );
        }}
      />
    </>
  );
}
