import {
  DocumentNode, OperationVariables, QueryHookOptions, QueryResult, TypedDocumentNode,
  useQuery as apolloUseQuery,
} from '@apollo/client';
import { useMemo, useRef } from 'react';

// useQueryPatched removes fetchPolicy from options after the first
// useQuery call, since it will otherwise not use the nextFetchPolicy.
export default function useQueryPatched<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  rawOptions?: QueryHookOptions<TData, TVariables>,
): QueryResult<TData, TVariables> {
  const firstUpdate = useRef(true);

  const options = useMemo(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return rawOptions;
    }

    const newOptions = { ...rawOptions };
    delete newOptions.fetchPolicy;

    return newOptions;
  }, [rawOptions]);

  return apolloUseQuery(query, options);
}
