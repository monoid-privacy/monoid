import React, { useState } from 'react';
import Button from '../../../../components/Button';
import Card from '../../../../components/Card';
import { InputLabel } from '../../../../components/Input';
import PageHeader from '../../../../components/PageHeader';
import { SiloSpec } from '../../../../lib/models';
import SourcesCombobox from './components/SourcesCombobox';

export default function NewSiloPage() {
  const [silo, setSilo] = useState<{
    siloSpec?: SiloSpec
  }>({
    siloSpec: undefined,
  });

  return (
    <>
      <PageHeader title="New Silo" />
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
            <Button className="justify-center" onClick={() => { }}>
              Submit
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
