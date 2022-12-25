import { useQuery } from '@apollo/client';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import EmptyState from 'components/Empty';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AlertRegion from '../../../components/AlertRegion';
import Button from '../../../components/Button';
import Card, { CardDivider, CardHeader } from '../../../components/Card';
import Spinner from '../../../components/Spinner';
import { GET_ALL_SCANS } from '../../../graphql/jobs_queries';
import { Job } from '../../../lib/models';
import JobRow from '../../Silos/pages/SiloPage/components/JobRow';

function ScansCardBody() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_ALL_SCANS, {
    variables: {
      workspaceId: id!,
      status: [],
      limit: 5,
      offset: 0,
    },
  });
  const navigate = useNavigate();

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <AlertRegion alertTitle="Error">
        {error.message}
      </AlertRegion>
    );
  }

  if ((data?.workspace.jobs.numJobs || 0) === 0) {
    return (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="No Scans"
        subtitle="No scans have been run in this workspace."
        className="flex-1 flex flex-col justify-center"
        action={null}
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-200 overflow-scroll flex-1">
      {
        (data?.workspace.jobs.jobs as Job[]).map((j) => (
          <JobRow
            key={j.id!}
            job={j}
            showSiloDefinition
            onClick={() => {
              navigate(`../silos/${j.siloDefinition?.id}/scans?query=${j.id}`);
            }}
          />
        ))
      }
    </ul>
  );
}

export default function ScansCard() {
  return (
    <Card className="flex-1 h-[30rem]" innerClassName="flex flex-col h-full">
      <CardHeader>
        Recent Scans
      </CardHeader>
      <CardDivider />
      <ScansCardBody />
      <CardDivider />
      <div className="flex">
        <Button type="link" variant="outline-white" className="ml-auto" to="../scans">
          View All
        </Button>
      </div>
    </Card>
  );
}
