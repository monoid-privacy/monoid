import {
  CheckCircleIcon, ChevronRightIcon, QuestionMarkCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import Text from '../../../../../components/Text';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';
import { classNames } from '../../../../../utils/utils';
import AlertRegion from '../../../../../components/AlertRegion';
import SVGText from '../../../../../components/SVGText';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const GET_JOB = gql`
  query GetJob($workspaceId: ID!, $id: ID!) {
    workspace(id: $workspaceId) {
      job(
        id: $id
      ) {
        id
        logs
      }
    }
  }
`;

function JobLogs(props: {
  id: string
}) {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { id } = props;
  const { data, loading, error } = useQuery(GET_JOB, {
    variables: {
      id,
      workspaceId,
    },
  });

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

  if (data.workspace.job.logs.length === 0) {
    return (
      <div className="bg-gray-100 text-sm py-3">
        No logs found
      </div>
    );
  }

  const itemContent = (i: number) => (
    <div className="flex hover:bg-gray-200">
      <code className="w-10 flex-shrink-0">{i}</code>
      <pre>{data.workspace.job.logs[i]}</pre>
    </div>
  );

  return (
    <Virtuoso
      totalCount={data.workspace.job.logs.length}
      itemContent={itemContent}
      style={{ height: '400px' }}
      className="text-xs"
    />
  );
}

export default function JobRow(props: {
  job: Job,
  showSiloDefinition?: boolean
  onClick?: () => void
  openable?: boolean
}) {
  const {
    job, showSiloDefinition, onClick, openable,
  } = props;
  let jobStatusText = '';
  let jobIcon = <QuestionMarkCircleIcon className="h-5 w-5" />;
  const [open, setOpen] = useState(false);

  switch (job.status) {
    case 'RUNNING':
      jobStatusText = 'Scan Running';
      jobIcon = <Spinner />;
      break;
    case 'QUEUED':
      jobStatusText = 'Scan Queued';
      jobIcon = <Spinner />;
      break;
    case 'FAILED':
      jobStatusText = 'Scan Failed';
      jobIcon = <XCircleIcon className="h-7 w-7 text-red-600" />;
      break;
    case 'COMPLETED':
      jobStatusText = 'Scan Succeeded';
      jobIcon = <CheckCircleIcon className="h-7 w-7 text-green-400" />;
      break;
    default:
      break;
  }

  return (
    <li>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className={classNames('block hover:bg-gray-50', onClick || openable ? 'cursor-pointer' : '')}
        onClick={() => {
          if (onClick) onClick();
          if (openable) setOpen(!open);
        }}
        onKeyDown={
          () => {
            if (onClick) onClick();
            if (openable) setOpen(!open);
          }
        }
      >
        <div className="px-4 py-4 sm:px-6 flex items-center">
          <div className="flex flex-col">
            <div className="flex space-x-2 items-center mb-1">
              {
                showSiloDefinition && (
                  <>
                    {job.siloDefinition?.siloSpecification?.logo
                      && (
                        <SVGText
                          className="w-4 h-4"
                          imageText={job.siloDefinition.siloSpecification.logo}
                          alt={`${job.siloDefinition.siloSpecification.name} Logo`}
                        />
                      )}
                    <Text em="bold" className="text-gray-400">
                      {job.siloDefinition?.name}
                    </Text>
                    <ChevronRightIcon className="w-4 h-4" />
                  </>
                )
              }
              <Text em={showSiloDefinition ? 'bold' : 'normal'}>
                {jobStatusText}
              </Text>
            </div>
            <Text size="xs" em="light">
              Ran
              {' '}
              {dayjs(job.createdAt!).fromNow()}
              {' '}
              |
              {' '}
              {dayjs(job.createdAt!).format('YYYY-MM-DD @ HH:MM:ss')}
            </Text>
          </div>
          <div className="ml-auto flex items-center">
            {jobIcon}
            {onClick && <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-3" />}
          </div>
        </div>
      </div>
      {
        openable && open && (
          <div className="px-7 bg-gray-100">
            <JobLogs id={job.id!} />
          </div>
        )
      }

    </li>
  );
}

JobRow.defaultProps = {
  showSiloDefinition: false,
  onClick: undefined,
  openable: false,
};
