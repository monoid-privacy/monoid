import { FieldPolicy, FieldReadFunction } from '@apollo/client';
import { paginationMerge, paginationRead } from './helpers';

export default function dataMapCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['query'],
    read: paginationRead('dataMapRows'),
    merge: paginationMerge('dataMapRows', 'numRows'),
  });
}
