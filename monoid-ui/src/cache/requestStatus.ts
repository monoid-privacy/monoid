import { FieldPolicy, FieldReadFunction } from '@apollo/client';
import { paginationMerge, paginationRead } from './helpers';

export default function requestStatusCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['query'],
    read: paginationRead('requestStatusRows'),
    merge: paginationMerge('requestStatusRows', 'numStatuses'),
  });
}
