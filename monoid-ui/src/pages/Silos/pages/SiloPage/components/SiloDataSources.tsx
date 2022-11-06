import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import Button from '../../../../../components/Button';
import Spinner from '../../../../../components/Spinner';

const RUN_SOURCE_SCAN = gql`
  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {
    detectSiloSources(id: $id, workspaceId: $workspaceId)
  }
`;

export default function SiloDataSources() {
  const [runScan, runScanRes] = useMutation(RUN_SOURCE_SCAN);
  const { siloId, id } = useParams<{ siloId: string, id: string }>();

  return (
    <Button onClick={() => {
      runScan({
        variables: {
          id: siloId,
          workspaceId: id,
        },
      });
    }}
    >
      {runScanRes.loading ? <Spinner /> : 'Run Scan'}
    </Button>
  );
}
