import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
export const GET_PRIMARY_KEYS = gql`
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
`;
