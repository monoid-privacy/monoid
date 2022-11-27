import { gql, useQuery } from '@apollo/client';
import React from 'react';
import Combobox from '../../../../../components/MultiCombobox';
import Spinner from '../../../../../components/Spinner';
import SVGText from '../../../../../components/SVGText';
import { SiloSpec } from '../../../../../lib/models';

const GET_SILO_SPECS = gql`
  query GetSiloSpecs {
    siloSpecifications {
      id
      name
      logo
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

  const displayNode = (ss: SiloSpec) => (
    <div className="flex items-center space-x-2">
      {ss.logo
        && (
          <SVGText
            className="w-4 h-4"
            imageText={ss.logo}
            alt={`${ss.name} Logo`}
          />
        )}
      <div className="text-sm">{ss.name}</div>
    </div>
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <Combobox<SiloSpec>
      value={data!.siloSpecifications.find((ss: SiloSpec) => ss.id === value)}
      onChange={(v) => { if (v) { setValue(v); } }}
      filter={(q) => Promise.resolve(data!.siloSpecifications.filter(
        (ss) => ss.name.toLowerCase().includes(q.toLowerCase()),
      ))}
      id={(ss) => ss.id}
      displayNode={displayNode}
      isMulti={false}
    />
  );
}
