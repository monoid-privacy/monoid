import { FieldPolicy, FieldReadFunction } from '@apollo/client';
import { paginationMerge, paginationRead } from './helpers';

export default function jobsQueryCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['resourceId', 'jobType', 'status', 'query'],
    read: paginationRead('jobs'),
    merge: paginationMerge('jobs', 'numJobs'),
  });
}
