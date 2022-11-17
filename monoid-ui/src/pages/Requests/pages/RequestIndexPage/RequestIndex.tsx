import React from 'react';
import Button from '../../../../components/Button';
import PageHeader from '../../../../components/PageHeader';
import RequestList from './components/RequestList';

export default function RequestIndex() {
  return (
    <>
      <PageHeader
        title="User Data Requests "
        actionItem={(
          <Button to="new" type="link">
            New User Data Request
          </Button>
        )}
      />
      <RequestList />
    </>
  );
}
