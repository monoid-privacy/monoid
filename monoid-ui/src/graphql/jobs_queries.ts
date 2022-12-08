import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
export const GET_ALL_SCANS = gql`
  query GetWorkspaceScans($workspaceId: ID!, $status: [JobStatus], $query: String, $limit: Int!, $offset: Int!) {
    workspace(id: $workspaceId) {
      id
      jobs(
        jobType: "discover_sources",
        status: $status,
        limit: $limit,
        offset: $offset,
        query: $query
      ) {
        jobs {
          id
          jobType
          status
          createdAt
          siloDefinition {
            id
            name
            siloSpecification {
              id
              name
              logo
            }
          }
        }
        numJobs
      }
    }
  }
`;

export const RUN_SOURCE_SCAN = gql`
  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {
    detectSiloSources(id: $id, workspaceId: $workspaceId) {
      id
      status
      jobType
    }
  }
`;
