import { useMutation, useQuery } from '@apollo/client';
import PageHeader from 'components/PageHeader';
import ToastContext from 'contexts/ToastContext';
import { RUN_SOURCE_SCAN } from 'graphql/jobs_queries';
import { Job, SiloDefinition } from 'lib/models';
import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import Text from 'components/Text';
import NewSiloForm from 'pages/Silos/pages/NewSiloPage/components/NewSiloForm';
import { ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { GET_SILOS } from 'graphql/silo_queries';
import Card from 'components/Card';
import Divider from 'components/Divider';
import { InputLabel } from 'components/Input';
import Combobox from 'components/MultiCombobox';
import Button from 'components/Button';

function SelectSiloCard(props: {
  onSuccess: (siloDefId: string) => void
}) {
  const { id } = useParams<{ id: string }>();
  const { onSuccess } = props;
  const { data, loading, error } = useQuery(GET_SILOS, {
    variables: {
      id: id!,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
  });

  const [val, setVal] = useState<SiloDefinition | undefined | null>(undefined);

  const dispNode = (v: SiloDefinition) => (
    <div className="text-sm">
      {v.name}
    </div>
  );

  if (loading || error) {
    return null;
  }

  if ((data?.workspace.siloDefinitions.length || 0) === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <div>
          <InputLabel className="mb-2">
            Select Existing Silo
          </InputLabel>
          <Combobox<SiloDefinition>
            filter={
              (q) => Promise.resolve((data?.workspace.siloDefinitions.filter((v) => (
                v.name?.toLowerCase().includes(q)
              )) || []) as SiloDefinition[])
            }
            id={(v) => v.id!}
            displayNode={dispNode}
            value={val || undefined}
            onChange={(v) => { setVal(v); }}
            isMulti={false}
          />
        </div>
        {' '}
        <Button
          disabled={!val}
          className="mt-6"
          onClick={() => {
            if (val) {
              onSuccess(val.id!);
            }
          }}
        >
          Next
        </Button>
      </Card>
      <Divider className="my-4">
        or
      </Divider>
    </>
  );
}

export default function CreateSiloDefBody(props: {
  onSuccess: (siloDefId: string, jobId: string) => void
}) {
  const { onSuccess } = props;
  const toastCtx = useContext(ToastContext);
  const [runScan] = useMutation<{ detectSiloSources: Job }>(RUN_SOURCE_SCAN);
  const { id } = useParams<{ id: string }>();
  const processSilo = (sdid: string) => {
    runScan({
      variables: {
        id: sdid,
        workspaceId: id,
      },
    }).then(({ data: resData }) => {
      onSuccess(sdid!, resData?.detectSiloSources.id!);
    }).catch((err) => {
      toastCtx.showToast({
        title: 'Error',
        message: err.message,
        icon: XCircleIcon,
        variant: 'danger',
      });
    });
  };

  return (
    <>
      <PageHeader title="Sync Data Silo" className="mb-2" />
      <Text className="mb-4" size="sm">
        Start by connecting a data silo that uses the identifier defined in the
        previous step. Brist will automatically scan the silo and find the data sources
        and categorize them.
      </Text>
      <SelectSiloCard onSuccess={(sdid) => {
        processSilo(sdid);
      }}
      />
      <NewSiloForm
        onSuccess={(sd) => {
          processSilo(sd.id!);
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
