import { FieldPolicy, FieldReadFunction } from '@apollo/client';
import { paginationMerge, paginationRead } from './helpers';

export default function requestsCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: [],
    read: paginationRead('requests'),
    merge: paginationMerge('requests', 'numRequests'),
  });
}
