import { gql, useMutation } from '@apollo/client';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AlertRegion from '../../../../components/AlertRegion';
import Button from '../../../../components/Button';
import Card from '../../../../components/Card';
import Input, { InputLabel } from '../../../../components/Input';
import PageHeader from '../../../../components/PageHeader';
import Spinner from '../../../../components/Spinner';
import { SiloSpec } from '../../../../lib/models';
import SiloFields from './components/SiloFields';
import SourcesCombobox from './components/SourcesCombobox';

const CREATE_NEW_SILO = gql`
  mutation CreateSilo($input: CreateSiloDefinitionInput!) {
    createSiloDefinition(input: $input) {
      id
    }
  }
`;

export default function NewSiloPage() {
  const [silo, setSilo] = useState<{
    siloSpec?: SiloSpec,
    name: string,
    siloData: any
  }>({
    siloSpec: undefined,
    name: '',
    siloData: {},
  });

  const { id } = useParams<{ id: string }>();

  const [createSilo, createSiloRes] = useMutation(CREATE_NEW_SILO);

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
              />
            )}

          {
            createSiloRes.error
            && (
              <div>
                <AlertRegion alertTitle="Error Connecting Silo">
                  {createSiloRes.error.message}
                </AlertRegion>
              </div>
            )
          }

          <div>
            <Button
              className="justify-center"
              onClick={() => {
                createSilo({
                  variables: {
                    input: {
                      name: silo.name,
                      siloSpecificationID: silo.siloSpec?.id,
                      workspaceID: id,
                      siloData: JSON.stringify(silo.siloData),
                    },
                  },
                });
              }}
            >
              {createSiloRes.loading ? <Spinner /> : 'Submit'}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
