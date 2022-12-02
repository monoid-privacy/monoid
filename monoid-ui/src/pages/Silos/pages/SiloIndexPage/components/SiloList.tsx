import React from 'react';

import { gql } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import useQuery from '../../../../../hooks/useQueryPatched';
import AlertRegion from '../../../../../components/AlertRegion';
import Spinner from '../../../../../components/Spinner';
import Table from '../../../../../components/Table';
import { SiloDefinition } from '../../../../../lib/models';
import SVGText from '../../../../../components/SVGText';

const GET_SILOS = gql`
  query GetSilos($id: ID!) {
    workspace(id: $id) {
      id
      siloDefinitions {
        id
        name
        siloSpecification {
          id
          name
          logo
        }
      }
    }
  }
`;

export default function SiloList() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{
    workspace: {
      siloDefinitions: SiloDefinition[]
    }
  }>(GET_SILOS, {
    variables: {
      id,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: () => 'cache-first',
  });
  const navigate = useNavigate();

  if (error) {
    return (
      <div>
        <AlertRegion alertTitle="Error loading silos">
          {error.message}
        </AlertRegion>
      </div>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <Table
      tableCols={[
        {
          header: 'Name',
          key: 'name',
        },
        {
          header: 'Silo Type',
          key: 'silo_type',
        },
      ]}
      tableRows={data?.workspace.siloDefinitions.map((sd) => ({
        key: sd.id!,
        onClick: () => {
          navigate(sd.id!);
        },
        columns: [
          {
            key: 'name',
            content: sd.name,
          },
          {
            key: 'silo_type',
            content: (
              <div className="flex space-x-2">
                {sd.siloSpecification!.logo
                  && (
                    <SVGText
                      className="w-5 h-5"
                      imageText={sd.siloSpecification!.logo}
                      alt={`${sd.siloSpecification!.name} Logo`}
                    />
                  )}
                <div>{sd.siloSpecification!.name}</div>
              </div>
            ),
          },
        ],
      }
      ))}
    />
  );
}
