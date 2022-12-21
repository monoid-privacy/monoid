// import { TypedDocumentNode } from '@apollo/client';
import { gql } from '__generated__/gql';
// import * as types from '__generated__/graphql';

export const DATA_SOURCE_FIELDS = gql(`
  fragment DataSourceFields on DataSource {
    id
    name
    group
  }
`);

export const PROPERTY_FIELDS = gql(`
  fragment PropertyFields on Property {
    id
    name
    dataSource {
      ...DataSourceFields
    }
  }
`);

export const CATEGORY_FIELDS = gql(`
  fragment CategoryFields on Category {
    id
    name
  }
`);

export const DISCOVERY_FIELDS = gql(`
  fragment DiscoveryFields on DataDiscovery {
    id
    type
    status
    createdAt
    data {
      __typename
      ... on NewDataSourceDiscovery {
        name
        group
        properties {
            name
            categories {
              categoryId
              category {
                ...CategoryFields
              }
            }
        }
      }
      ... on NewPropertyDiscovery {
        name
        dataSourceId
        dataSource {
          ...DataSourceFields
        }
        categories {
          categoryId
          category {
            ...CategoryFields
          }
        }
      }
      ... on NewCategoryDiscovery {
        propertyId
        categoryId
        property {
          ...PropertyFields
        }
        category {
          ...CategoryFields
        }
      }
      ... on PropertyMissingDiscovery {
        id
        property {
          ...PropertyFields
        }
      }
      ... on DataSourceMissingDiscovery {
        id
        dataSource {
          ...DataSourceFields
        }
      }
    }
  }
`);

export const GET_WORKSPACE_DISCOVERIES = gql(`
  query GetWorkspaceDiscoveries($workspaceId: ID!, $statuses: [DiscoveryStatus], $query: String, $limit: Int!, $offset: Int) {
    workspace(id: $workspaceId) {
      id
      discoveries(
        statuses: $statuses,
        query: $query,
        limit: $limit,
        offset: $offset
      ) {
        discoveries {
          ...DiscoveryFields
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
        numDiscoveries
      }
    }
  }
`);

export const GET_DISCOVERIES = gql(`
  query GetDiscoveries($id: ID!, $limit: Int!, $offset: Int!, $query: String, $statuses: [DiscoveryStatus]) {
    siloDefinition(id: $id) {
      id
      discoveries(limit: $limit, offset: $offset, query: $query, statuses: $statuses) {
        discoveries {
          ...DiscoveryFields
        }
        numDiscoveries
      }
    }
  }
`);
