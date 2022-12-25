import { gql } from '__generated__/gql';

export const GET_PRIMARY_KEYS = gql(`
  query GetPrimaryKeys($id: ID!) {
    workspace(id: $id) {
      id
      userPrimaryKeys {
        id
        name
        apiIdentifier
      }
    }
  }
`);

export const GET_REQUESTS = gql(`
query GetRequests($id: ID!, $limit: Int!, $offset: Int) {
  workspace(id: $id) {
    id
    requests(limit: $limit, offset: $offset) {
      requests {
        id
        type
        createdAt
        status
      }
      numRequests
    }
  }
}
`);

export const EXECUTE_REQUEST = gql(`
  mutation ExecuteRequest($id: ID!) {
    executeUserDataRequest(requestId: $id) {
      id
      status
    }
  }
`);
