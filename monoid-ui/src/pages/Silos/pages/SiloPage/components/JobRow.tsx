import {
  CheckCircleIcon, ChevronRightIcon, QuestionMarkCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Text from '../../../../../components/Text';
import Spinner from '../../../../../components/Spinner';
import { Job } from '../../../../../lib/models';
import { classNames } from '../../../../../utils/utils';

dayjs.extend(updateLocale);
dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function JobRow(props: {
  job: Job,
  showSiloDefinition?: boolean
  onClick?: () => void
}) {
  const { job, showSiloDefinition, onClick } = props;
  let jobStatusText = '';
  let jobIcon = <QuestionMarkCircleIcon className="h-5 w-5" />;

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
        className={classNames('block hover:bg-gray-50', onClick ? 'cursor-pointer' : '')}
        onClick={() => {
          if (onClick) onClick();
        }}
        onKeyDown={
          () => {
            if (onClick) onClick();
          }
        }
      >
        <div className="px-4 py-4 sm:px-6 flex items-center">
          <div className="flex flex-col">
            <div className="flex space-x-2 items-center mb-1">
              {
                showSiloDefinition && (
                  <>
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
    </li>
  );
}

JobRow.defaultProps = {
  showSiloDefinition: false,
  onClick: undefined,
};
