import { FieldPolicy, FieldReadFunction } from '@apollo/client';
import { paginationMerge, paginationRead } from './helpers';

export default function discoveriesCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['query', 'statuses'],
    read: paginationRead('discoveries'),
    merge: paginationMerge('discoveries', 'numDiscoveries'),
  });
}
