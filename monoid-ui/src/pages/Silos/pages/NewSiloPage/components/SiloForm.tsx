import React, { useEffect, useState } from 'react';
import AlertRegion from '../../../../../components/AlertRegion';
import Button from '../../../../../components/Button';
import Card from '../../../../../components/Card';
import Input, { InputLabel } from '../../../../../components/Input';
import Spinner from '../../../../../components/Spinner';
import { SiloDefinition, SiloSpec } from '../../../../../lib/models';
import SiloFields from './SiloFields';
import SourcesCombobox from './SourcesCombobox';

interface SiloFormData {
  name: string,
  siloSpec?: SiloSpec,
  siloData: any,
}

export default function SiloForm(props: {
  onSubmit: (silo: SiloFormData) => void,
  defaultSilo?: SiloDefinition,
  loading?: boolean,
  error?: Error,
}) {
  const {
    onSubmit, loading, defaultSilo, error,
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
    <Card className="mt-5">
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

        <div>
          <Button
            className="justify-center"
            onClick={() => {
              onSubmit(silo);
            }}
          >
            {loading ? <Spinner /> : 'Submit'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

SiloForm.defaultProps = {
  defaultSilo: undefined,
  loading: false,
  error: undefined,
};
