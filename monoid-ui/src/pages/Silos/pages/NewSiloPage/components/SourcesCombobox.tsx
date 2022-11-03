import { gql, useQuery } from '@apollo/client';
import React from 'react';
import Combobox from '../../../../../components/Combobox';
import Spinner from '../../../../../components/Spinner';
import { SiloSpec } from '../../../../../lib/models';

const GET_SILO_SPECS = gql`
  query GetSiloSpecs {
    siloSpecifications {
      id
      name
      logoUrl
      schema
    }
  }
`;

export default function SourcesCombobox(props: {
  value: string | undefined,
  setValue: (s: SiloSpec) => void
}) {
  const { value, setValue } = props;
  const { data, loading, error } = useQuery<{ siloSpecifications: SiloSpec[] }>(GET_SILO_SPECS);
  if (error) {
    return (
      <div>
        {error.message}
      </div>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <Combobox<SiloSpec>
      value={data!.siloSpecifications.find((ss: SiloSpec) => ss.id === value)}
      onChange={(v) => { setValue(v); }}
      filter={(q) => data!.siloSpecifications.filter(
        (ss) => ss.name.toLowerCase().includes(q.toLowerCase()),
      )}
      id={(ss) => ss.id}
      displayText={(ss) => ss.name}
    />
  );
}
