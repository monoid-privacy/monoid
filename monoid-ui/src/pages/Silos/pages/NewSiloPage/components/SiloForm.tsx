import React, { useEffect, useState } from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import Button from '../../../../../components/Button';
import Input, { InputLabel } from '../../../../../components/Input';
import Spinner from '../../../../../components/Spinner';
import { SiloDefinition, SiloSpec } from '../../../../../lib/models';
import SiloFields from './SiloFields';
import SourcesCombobox from './SourcesCombobox';
import Text from '../../../../../components/Text';

interface SiloFormData {
  name: string,
  siloSpec?: SiloSpec,
  siloData: any,
}

export default function SiloForm(props: {
  onSubmit: (silo: SiloFormData) => void,
  onCancel: () => void,
  defaultSilo?: SiloDefinition,
  loading?: boolean,
  error?: Error,
}) {
  const {
    onSubmit, onCancel, loading, defaultSilo, error,
  } = props;
  const [silo, setSilo] = useState<SiloFormData>({
    name: '',
    siloSpec: undefined,
    siloData: {},
  });

  useEffect(() => {
    if (!defaultSilo) {
      return;
    }

    setSilo({
      name: defaultSilo.name!,
      siloSpec: defaultSilo.siloSpecification!,
      siloData: defaultSilo.siloConfig!,
    });
  }, [defaultSilo]);

  return (
    <div className="space-y-6">
      <div>
        <InputLabel htmlFor="dataSilo">
          Data Silo Type
        </InputLabel>
        <div className="mt-2">
          <SourcesCombobox
            value={silo.siloSpec?.id}
            setValue={(v) => {
              setSilo({
                ...silo,
                siloSpec: v,
              });
            }}
          />
        </div>
      </div>
      <div>
        <InputLabel htmlFor="siloName">
          Data Silo Name
        </InputLabel>
        <div className="mt-2">
          <Input
            value={silo.name}
            onChange={(e) => {
              setSilo({
                ...silo,
                name: e.target.value,
              });
            }}
          />
        </div>
      </div>
      {silo.siloSpec
        && (
          <SiloFields
            siloID={silo.siloSpec?.id}
            siloData={silo.siloData}
            setSiloData={(siloData) => {
              setSilo({
                ...silo,
                siloData,
              });
            }}
            prefilled={defaultSilo !== undefined}
          />
        )}

      {
        error && (
          <div>
            <AlertRegion alertTitle="Error Connecting Silo">
              {error.message}
            </AlertRegion>
          </div>
        )
      }

      <div className="flex flex-col space-y-3 items-start">
        {loading && (
          <div className="flex items-center space-x-1">
            <Spinner />
            <Text em="light" size="sm">Validating (this may take a minute)...</Text>
          </div>
        )}
        <Button
          className="justify-center"
          variant={loading ? 'danger' : 'primary'}
          onClick={() => {
            if (loading) {
              onCancel();
            } else {
              onSubmit(silo);
            }
          }}
        >
          {loading ? 'Cancel' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

SiloForm.defaultProps = {
  defaultSilo: undefined,
  loading: false,
  error: undefined,
};
