import { useMutation } from '@apollo/client';
import Card from 'components/Card';
import PageHeader from 'components/PageHeader';
import { EXECUTE_REQUEST } from 'graphql/requests_queries';
import NewRequestForm from 'pages/Requests/pages/NewRequestPage/components/NewRequestForm';
import Text from 'components/Text';
import { Job } from 'lib/models';
import React from 'react';

export default function RequestBody(props: { onSuccess: (reqId: string) => void }) {
  const [executeReq] = useMutation<{ executeUserDataRequest: Job }>(EXECUTE_REQUEST);
  const { onSuccess } = props;

  return (
    <>
      <PageHeader title="Create Request" className="mb-2" />
      <Text className="mb-4" size="sm">
        Now that you&apos;ve set up your silo and sources, you can create a test request.
        You should try creating a query requeest first, as you&apos;ll be able to see the results
        more clearly. We&apos;ll also automatically execute the request for you
        (by default, future requests will get executed after you manually approve them).
      </Text>
      <Card>
        <NewRequestForm
          actionName="Create and Execute"
          onSuccess={(req) => {
            executeReq({
              variables: {
                id: req.id,
              },
            }).then(() => {
              onSuccess(req.id!);
            });
          }}
        />
      </Card>
    </>
  );
}
