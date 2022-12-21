import React from 'react';
import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import { gql } from '__generated__/gql';
import LoadingPage from '../../common/LoadingPage';
import OnboardingForm from './OnboardingForm';

const GET_WORKSPACES = gql(`
  query GetWorkspaces {
    workspaces {
      id
    }
  }
`);

export default function WorkspaceAutoSelect() {
  const { data, loading, error } = useQuery(GET_WORKSPACES);

  if (loading) {
    return <LoadingPage />;
  }

  if (data) {
    if (data.workspaces.length === 0) {
      return <OnboardingForm />;
    }
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return <Navigate to={`/workspaces/${data!.workspaces[0]!.id}`} />;
}
