import { useQuery } from '@apollo/client';
import React from 'react';
import { useParams } from 'react-router-dom';
import { gql } from '__generated__/gql';
import Combobox from '../../../../../components/MultiCombobox';
import Spinner from '../../../../../components/Spinner';
import SVGText from '../../../../../components/SVGText';
import { SiloSpec } from '../../../../../lib/models';

const GET_SILO_SPECS = gql(`
  query GetSiloSpecs($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      siloSpecifications {
        id
        name
        logo
        schema
      }
    }
  }
`);

export default function SourcesCombobox(props: {
  value: string | undefined,
  setValue: (s: SiloSpec) => void
}) {
  const { value, setValue } = props;
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_SILO_SPECS, {
    variables: {
      workspaceId: id!,
    },
  });

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
      value={data!.workspace.siloSpecifications.find((ss) => ss.id === value) as SiloSpec}
      onChange={(v) => { if (v) { setValue(v); } }}
      filter={(q) => Promise.resolve(data!.workspace.siloSpecifications.filter(
        (ss) => ss.name.toLowerCase().includes(q.toLowerCase()),
      ) as SiloSpec[])}
      id={(ss) => ss.id}
      displayNode={displayNode}
      isMulti={false}
    />
  );
}
