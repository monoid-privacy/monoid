import { ApolloError, gql, useQuery } from '@apollo/client';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Workspace } from '../lib/models';

interface WorkspaceContextType {
  workspace?: Workspace
  loading: boolean,
  error?: ApolloError,
}

const initVal: WorkspaceContextType = {
  workspace: undefined,
  loading: true,
  error: undefined,
};

const WorkspaceContext = React.createContext(initVal);
export default WorkspaceContext;

const WORKSPACE_QUERY = gql`
  query WorkspaceQuery($id: ID!) {
    workspace(id: $id) {
      id
      name
      onboardingComplete
    }
  }
`;

export function WorkspaceProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ workspace: Workspace }>(WORKSPACE_QUERY, {
    variables: {
      id,
    },
  });

  const providerVal = useMemo(() => ({
    workspace: data?.workspace,
    loading,
    error,
  }), [data, loading]);

  return (
    <WorkspaceContext.Provider value={providerVal}>
      {children}
    </WorkspaceContext.Provider>
  );
}
