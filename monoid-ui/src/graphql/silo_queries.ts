/* eslint-disable import/prefer-default-export */
import { gql } from '__generated__/gql';

export const SILO_DATA_SOURCES = gql(`
query SiloDataSources($id: ID!) {
  siloDefinition(id: $id) {
    id
    siloSpecification {
      id
      manual
    }
    dataSources {
      id
      name
      group
      properties {
        id
        name
        categories {
          id
          name
        }
        userPrimaryKey {
          id
          name
        }
      }
    }
  }
}
`);

export const GET_SILOS = gql(`
  query GetSilos($id: ID!) {
    workspace(id: $id) {
      id
      siloDefinitions {
        id
        name
        siloSpecification {
          id
          name
          logo
        }
      }
    }
  }
`);
