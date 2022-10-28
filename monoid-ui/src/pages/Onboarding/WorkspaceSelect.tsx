import React from 'react';
import { gql, useQuery } from '@apollo/client';
import LoadingPage from '../../components/LoadingPage';
import OnboardingForm from './OnboardingForm';

const GET_WORKSPACES = gql`
  query GetWorkspaces {
    workspaces {
      id
    }
  }
`;

export default function WorkspaceSelect() {
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

  return <div />;
}
