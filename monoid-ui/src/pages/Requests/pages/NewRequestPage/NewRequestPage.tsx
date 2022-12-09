import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../components/Card';
import PageHeader from '../../../../components/PageHeader';
import NewRequestForm from './components/NewRequestForm';

export default function NewRequestPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="New Request" />
      <Card className="mt-5">
        <NewRequestForm onSuccess={(r) => {
          navigate(`../${r.id!}`);
        }}
        />
      </Card>
    </>
  );
}
