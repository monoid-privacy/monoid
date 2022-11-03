import React from 'react';
import Button from '../../../../components/Button';
import PageHeader from '../../../../components/PageHeader';

export default function SiloIndex() {
  return (
    <PageHeader
      title="Data Silos"
      actionItem={(
        <Button to="new" type="link">
          New Data Silo
        </Button>
      )}
    />
  );
}
