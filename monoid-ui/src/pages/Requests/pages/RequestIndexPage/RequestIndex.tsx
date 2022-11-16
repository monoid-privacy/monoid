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
          <>
            <Button to="new_primary_key" type="link">
              New Primary Key
            </Button>
            <Button to="new" type="link">
              New User Data Request
            </Button>
          </>
        )}
      />
      <RequestList />
    </>
  );
}
