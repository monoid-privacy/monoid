import { gql } from '@apollo/client';

export const DATA_SOURCE_FIELDS = gql`
  fragment DataSourceFields on DataSource {
    id
    name
    group
  }
`;

export const PROPERTY_FIELDS = gql`
  ${DATA_SOURCE_FIELDS}
  fragment PropertyFields on Property {
    id
    name
    dataSource {
      ...DataSourceFields
    }
  }
`;

export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id
    name
  }
`;

// eslint-disable-next-line import/prefer-default-export
export const GET_DISCOVERIES = gql`
  ${DATA_SOURCE_FIELDS}
  ${PROPERTY_FIELDS}
  ${CATEGORY_FIELDS}
  query GetDiscoveries($id: ID!, $workspaceId: ID!, $limit: Int!, $offset: Int!) {
    workspace(id: $workspaceId) {
      siloDefinition(id: $id) {
        id
        discoveries(limit: $limit, offset: $offset) {
          discoveries {
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
          numDiscoveries
        }
      }
    }
  }
`;
