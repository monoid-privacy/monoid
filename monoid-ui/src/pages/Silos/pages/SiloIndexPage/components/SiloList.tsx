import React from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import useQuery from 'hooks/useQueryPatched';
import AlertRegion from 'components/AlertRegion';
import Spinner from 'components/Spinner';
import Table from 'components/Table';
import { SiloDefinition } from 'lib/models';
import SVGText from 'components/SVGText';
import { GET_SILOS } from 'graphql/silo_queries';
import Card from 'components/Card';
import EmptyState from 'components/Empty';
import { CloudIcon } from '@heroicons/react/24/outline';
import Button from 'components/Button';

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

  if ((data?.workspace.siloDefinitions.length || 0) === 0) {
    return (
      <Card>
        <EmptyState
          icon={CloudIcon}
          title="No Data Silos"
          subtitle="No data silos were found in this workspace."
          className="py-7"
          action={<Button type="link" to="new">New Data Silo</Button>}
        />
      </Card>
    );
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
