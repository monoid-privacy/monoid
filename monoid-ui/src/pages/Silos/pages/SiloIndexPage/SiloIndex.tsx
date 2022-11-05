import React from 'react';
import Button from '../../../../components/Button';
import PageHeader from '../../../../components/PageHeader';
import SiloList from './components/SiloList';

export default function SiloIndex() {
  return (
    <>
      <PageHeader
        title="Data Silos"
        actionItem={(
          <Button to="new" type="link">
            New Data Silo
          </Button>
        )}
      />
      <SiloList />
    </>
  );
}
