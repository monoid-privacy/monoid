/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel-plugin for production.
 */
const documents = {
    "\n  query WorkspaceQuery($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      onboardingComplete\n    }\n  }\n": types.WorkspaceQueryDocument,
    "\n  fragment DataSourceFields on DataSource {\n    id\n    name\n    group\n  }\n": types.DataSourceFieldsFragmentDoc,
    "\n  fragment PropertyFields on Property {\n    id\n    name\n    dataSource {\n      ...DataSourceFields\n    }\n  }\n": types.PropertyFieldsFragmentDoc,
    "\n  fragment CategoryFields on Category {\n    id\n    name\n  }\n": types.CategoryFieldsFragmentDoc,
    "\n  fragment DiscoveryFields on DataDiscovery {\n    id\n    type\n    status\n    createdAt\n    data {\n      __typename\n      ... on NewDataSourceDiscovery {\n        name\n        group\n        properties {\n            name\n            categories {\n              categoryId\n              category {\n                ...CategoryFields\n              }\n            }\n        }\n      }\n      ... on NewPropertyDiscovery {\n        name\n        dataSourceId\n        dataSource {\n          ...DataSourceFields\n        }\n        categories {\n          categoryId\n          category {\n            ...CategoryFields\n          }\n        }\n      }\n      ... on NewCategoryDiscovery {\n        propertyId\n        categoryId\n        property {\n          ...PropertyFields\n        }\n        category {\n          ...CategoryFields\n        }\n      }\n      ... on PropertyMissingDiscovery {\n        id\n        property {\n          ...PropertyFields\n        }\n      }\n      ... on DataSourceMissingDiscovery {\n        id\n        dataSource {\n          ...DataSourceFields\n        }\n      }\n    }\n  }\n": types.DiscoveryFieldsFragmentDoc,
    "\n  query GetWorkspaceDiscoveries($workspaceId: ID!, $statuses: [DiscoveryStatus], $query: String, $limit: Int!, $offset: Int) {\n    workspace(id: $workspaceId) {\n      id\n      discoveries(\n        statuses: $statuses,\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        discoveries {\n          ...DiscoveryFields\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numDiscoveries\n      }\n    }\n  }\n": types.GetWorkspaceDiscoveriesDocument,
    "\n  query GetDiscoveries($id: ID!, $limit: Int!, $offset: Int!, $query: String, $statuses: [DiscoveryStatus]) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: $limit, offset: $offset, query: $query, statuses: $statuses) {\n        discoveries {\n          ...DiscoveryFields\n        }\n        numDiscoveries\n      }\n    }\n  }\n": types.GetDiscoveriesDocument,
    "\n  query GetWorkspaceScans($workspaceId: ID!, $status: [JobStatus], $query: String, $limit: Int!, $offset: Int!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        jobType: \"discover_sources\",\n        status: $status,\n        limit: $limit,\n        offset: $offset,\n        query: $query\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numJobs\n      }\n    }\n  }\n": types.GetWorkspaceScansDocument,
    "\n  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {\n    detectSiloSources(id: $id, workspaceId: $workspaceId) {\n      id\n      status\n      jobType\n    }\n  }\n": types.RunSourceScanDocument,
    "\n  query GetPrimaryKeys($id: ID!) {\n    workspace(id: $id) {\n      id\n      userPrimaryKeys {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n": types.GetPrimaryKeysDocument,
    "\nquery GetRequests($id: ID!, $limit: Int!, $offset: Int) {\n  workspace(id: $id) {\n    id\n    requests(limit: $limit, offset: $offset) {\n      requests {\n        id\n        type\n        createdAt\n        status\n      }\n      numRequests\n    }\n  }\n}\n": types.GetRequestsDocument,
    "\n  mutation ExecuteRequest($id: ID!) {\n    executeUserDataRequest(requestId: $id) {\n      id\n      status\n    }\n  }\n": types.ExecuteRequestDocument,
    "\nquery SiloDataSources($id: ID!) {\n  siloDefinition(id: $id) {\n    id\n    siloSpecification {\n      id\n      manual\n    }\n    dataSources {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n        userPrimaryKey {\n          id\n          name\n        }\n      }\n    }\n  }\n}\n": types.SiloDataSourcesDocument,
    "\n  query GetSilos($id: ID!) {\n    workspace(id: $id) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          name\n          logo\n        }\n      }\n    }\n  }\n": types.GetSilosDocument,
    "\n  query DataMapQuery($workspaceId: ID!, $limit: Int!, $offset: Int, $query: DataMapQuery) {\n    workspace(id: $workspaceId) {\n      id\n      dataMap(limit: $limit, offset: $offset, query: $query) {\n        dataMapRows {\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n          property {\n            id\n            name\n            categories {\n              id\n              name\n            }\n          }\n          dataSource {\n            id\n            name\n          }\n        }\n        numRows\n      }\n    }\n  }\n": types.DataMapQueryDocument,
    "\n  query FilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logoUrl\n        }\n      }\n      categories {\n        id\n        name\n      }\n    }\n  }\n": types.FilterOptionsQueryDocument,
    "\n  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {\n    createUserPrimaryKey(input: $input) {\n      id\n    }\n  }\n": types.CreatePrimaryKeyDocument,
    "\n  mutation CompleteOnboarding($id: ID!) {\n    completeWorkspaceOnboarding(id: $id) {\n      id\n      onboardingComplete\n    }\n  }\n": types.CompleteOnboardingDocument,
    "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n    }\n  }\n": types.CreateWorkspaceDocument,
    "\n  query GetWorkspaces {\n    workspaces {\n      id\n    }\n  }\n": types.GetWorkspacesDocument,
    "\n  query GetJobStatus($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        status\n      }\n    }\n  }\n": types.GetJobStatusDocument,
    "\n  mutation CreateRequest($input: UserDataRequestInput!) {\n    createUserDataRequest(input: $input) {\n      id\n    }\n  }\n": types.CreateRequestDocument,
    "\n  query GetRequestMetadata($id: ID!) {\n    request(id: $id) {\n      id\n      type\n      status\n    }\n  }\n": types.GetRequestMetadataDocument,
    "\n  mutation GetRequestFile($id: ID!) {\n    generateRequestDownloadLink(requestId: $id) {\n      url\n    }\n  }\n": types.GetRequestFileDocument,
    "\nquery GetPrimaryKeyValues($id: ID!) {\n  request(id: $id) {\n    id\n    type\n    primaryKeyValues {\n      id\n      value\n      userPrimaryKey {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n}\n": types.GetPrimaryKeyValuesDocument,
    "\n  query RequestFilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logo\n        }\n      }\n    }\n  }\n": types.RequestFilterOptionsQueryDocument,
    "\nquery GetRequestData($id: ID!, $limit: Int!, $offset: Int!, $query: RequestStatusQuery!) {\n  request(id: $id) {\n    id\n    type\n    requestStatuses(offset: $offset, limit: $limit, query: $query) {\n      numStatuses\n      requestStatusRows {\n        id\n        status\n        dataSource {\n          id\n          name\n          group\n          deleted\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        queryResult {\n          id\n          records\n          resultType\n        }\n      }\n    }\n  }\n}\n": types.GetRequestDataDocument,
    "\n  mutation GetQueryResultFile($id: ID!) {\n    generateQueryResultDownloadLink(queryResultId: $id) {\n      url\n    }\n  }\n": types.GetQueryResultFileDocument,
    "\n  mutation UpdateRequestStatus($input: UpdateRequestStatusInput!) {\n    updateRequestStatus(input: $input) {\n      id\n      status\n      queryResult {\n        id\n        records\n        resultType\n      }\n    }\n  }\n": types.UpdateRequestStatusDocument,
    "\n  query GetSettings($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      settings\n    }\n  }\n": types.GetSettingsDocument,
    "\n  mutation UpdateSettings($input: UpdateWorkspaceSettingsInput!) {\n    updateWorkspaceSettings(input: $input) {\n      id\n      settings\n    }\n  }\n": types.UpdateSettingsDocument,
    "\n  mutation CreateSilo($input: CreateSiloDefinitionInput!) {\n    createSiloDefinition(input: $input) {\n      id\n    }\n  }\n": types.CreateSiloDocument,
    "\n  query GetSiloSpec($id: ID!) {\n    siloSpecification(id: $id) {\n      id\n      schema\n      manual\n    }\n  }\n": types.GetSiloSpecDocument,
    "\n  query GetSiloSpecs($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloSpecifications {\n        id\n        name\n        logo\n        schema\n      }\n    }\n  }\n": types.GetSiloSpecsDocument,
    "\n  query GetSiloTitle($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logo\n        manual\n      }\n    }\n  }\n": types.GetSiloTitleDocument,
    "\n  query GetCategory($id: ID!) {\n    category(id: $id) {\n      id\n      name\n    }\n  }\n": types.GetCategoryDocument,
    "\n  query WorkspaceCategories($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n": types.WorkspaceCategoriesDocument,
    "\n  mutation ApplyDiscovery($input: HandleDiscoveryInput!) {\n    handleDiscovery(input: $input) {\n      id\n      status\n    }\n  }\n": types.ApplyDiscoveryDocument,
    "\n  mutation DeleteDataSource($id: ID!) {\n    deleteDataSource(id: $id)\n  }\n": types.DeleteDataSourceDocument,
    "\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n": types.DeletePropertyDocument,
    "\n  mutation LinkKey($propertyId: ID!, $userPrimaryKeyId: ID) {\n    linkPropertyToPrimaryKey(propertyId: $propertyId, userPrimaryKeyId: $userPrimaryKeyId) {\n      id\n      userPrimaryKey {\n        id\n        name\n      }\n    }\n  }\n": types.LinkKeyDocument,
    "\n  query GetJob($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        logs\n      }\n    }\n  }\n": types.GetJobDocument,
    "\n  mutation UpdateCategories($input: UpdatePropertyInput!) {\n    updateProperty(input: $input) {\n      __typename\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n": types.UpdateCategoriesDocument,
    "\n  mutation CancelJob($id: ID!) {\n    cancelJob(id: $id) {\n      id\n      status\n    }\n  }\n": types.CancelJobDocument,
    "\n  query RunningDiscoverJobs($workspaceId: ID!, $resourceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(resourceId: $resourceId, jobType: \"discover_sources\", status: [RUNNING, QUEUED], limit: 1, offset: 0) {\n        jobs {\n          id\n          jobType\n          status\n        }\n      }\n    }\n  }\n": types.RunningDiscoverJobsDocument,
    "\n  query GetNumActiveDiscoveries($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: 1, offset: 0, statuses: [OPEN]) {\n        numDiscoveries\n      }\n    }\n  }\n": types.GetNumActiveDiscoveriesDocument,
    "\n  mutation ApplyAllDiscoveries($input: HandleAllDiscoveriesInput!) {\n    handleAllOpenDiscoveries(input: $input) {\n      id\n      status\n    }\n  }\n": types.ApplyAllDiscoveriesDocument,
    "\n  query GetSiloConfig($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logoUrl\n      }\n      siloConfig\n    }\n  }\n": types.GetSiloConfigDocument,
    "\n  mutation UpdateSilo($input: UpdateSiloDefinitionInput!) {\n    updateSiloDefinition(input: $input) {\n      id\n    }\n  }\n": types.UpdateSiloDocument,
    "\n  mutation CreateDataSource($input: CreateDataSourceInput!) {\n    createDataSource(input: $input) {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.CreateDataSourceDocument,
    "\n  query DiscoverJobs($workspaceId: ID!, $resourceId: ID!, $limit: Int!, $offset: Int!, $query: String) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        resourceId: $resourceId,\n        jobType: \"discover_sources\",\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n        }\n        numJobs\n      }\n    }\n  }\n": types.DiscoverJobsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query WorkspaceQuery($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      onboardingComplete\n    }\n  }\n"): (typeof documents)["\n  query WorkspaceQuery($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      onboardingComplete\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment DataSourceFields on DataSource {\n    id\n    name\n    group\n  }\n"): (typeof documents)["\n  fragment DataSourceFields on DataSource {\n    id\n    name\n    group\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment PropertyFields on Property {\n    id\n    name\n    dataSource {\n      ...DataSourceFields\n    }\n  }\n"): (typeof documents)["\n  fragment PropertyFields on Property {\n    id\n    name\n    dataSource {\n      ...DataSourceFields\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment CategoryFields on Category {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment CategoryFields on Category {\n    id\n    name\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment DiscoveryFields on DataDiscovery {\n    id\n    type\n    status\n    createdAt\n    data {\n      __typename\n      ... on NewDataSourceDiscovery {\n        name\n        group\n        properties {\n            name\n            categories {\n              categoryId\n              category {\n                ...CategoryFields\n              }\n            }\n        }\n      }\n      ... on NewPropertyDiscovery {\n        name\n        dataSourceId\n        dataSource {\n          ...DataSourceFields\n        }\n        categories {\n          categoryId\n          category {\n            ...CategoryFields\n          }\n        }\n      }\n      ... on NewCategoryDiscovery {\n        propertyId\n        categoryId\n        property {\n          ...PropertyFields\n        }\n        category {\n          ...CategoryFields\n        }\n      }\n      ... on PropertyMissingDiscovery {\n        id\n        property {\n          ...PropertyFields\n        }\n      }\n      ... on DataSourceMissingDiscovery {\n        id\n        dataSource {\n          ...DataSourceFields\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment DiscoveryFields on DataDiscovery {\n    id\n    type\n    status\n    createdAt\n    data {\n      __typename\n      ... on NewDataSourceDiscovery {\n        name\n        group\n        properties {\n            name\n            categories {\n              categoryId\n              category {\n                ...CategoryFields\n              }\n            }\n        }\n      }\n      ... on NewPropertyDiscovery {\n        name\n        dataSourceId\n        dataSource {\n          ...DataSourceFields\n        }\n        categories {\n          categoryId\n          category {\n            ...CategoryFields\n          }\n        }\n      }\n      ... on NewCategoryDiscovery {\n        propertyId\n        categoryId\n        property {\n          ...PropertyFields\n        }\n        category {\n          ...CategoryFields\n        }\n      }\n      ... on PropertyMissingDiscovery {\n        id\n        property {\n          ...PropertyFields\n        }\n      }\n      ... on DataSourceMissingDiscovery {\n        id\n        dataSource {\n          ...DataSourceFields\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetWorkspaceDiscoveries($workspaceId: ID!, $statuses: [DiscoveryStatus], $query: String, $limit: Int!, $offset: Int) {\n    workspace(id: $workspaceId) {\n      id\n      discoveries(\n        statuses: $statuses,\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        discoveries {\n          ...DiscoveryFields\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numDiscoveries\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspaceDiscoveries($workspaceId: ID!, $statuses: [DiscoveryStatus], $query: String, $limit: Int!, $offset: Int) {\n    workspace(id: $workspaceId) {\n      id\n      discoveries(\n        statuses: $statuses,\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        discoveries {\n          ...DiscoveryFields\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numDiscoveries\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDiscoveries($id: ID!, $limit: Int!, $offset: Int!, $query: String, $statuses: [DiscoveryStatus]) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: $limit, offset: $offset, query: $query, statuses: $statuses) {\n        discoveries {\n          ...DiscoveryFields\n        }\n        numDiscoveries\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetDiscoveries($id: ID!, $limit: Int!, $offset: Int!, $query: String, $statuses: [DiscoveryStatus]) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: $limit, offset: $offset, query: $query, statuses: $statuses) {\n        discoveries {\n          ...DiscoveryFields\n        }\n        numDiscoveries\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetWorkspaceScans($workspaceId: ID!, $status: [JobStatus], $query: String, $limit: Int!, $offset: Int!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        jobType: \"discover_sources\",\n        status: $status,\n        limit: $limit,\n        offset: $offset,\n        query: $query\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numJobs\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspaceScans($workspaceId: ID!, $status: [JobStatus], $query: String, $limit: Int!, $offset: Int!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        jobType: \"discover_sources\",\n        status: $status,\n        limit: $limit,\n        offset: $offset,\n        query: $query\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        numJobs\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {\n    detectSiloSources(id: $id, workspaceId: $workspaceId) {\n      id\n      status\n      jobType\n    }\n  }\n"): (typeof documents)["\n  mutation RunSourceScan($id: ID!, $workspaceId: ID!) {\n    detectSiloSources(id: $id, workspaceId: $workspaceId) {\n      id\n      status\n      jobType\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetPrimaryKeys($id: ID!) {\n    workspace(id: $id) {\n      id\n      userPrimaryKeys {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetPrimaryKeys($id: ID!) {\n    workspace(id: $id) {\n      id\n      userPrimaryKeys {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery GetRequests($id: ID!, $limit: Int!, $offset: Int) {\n  workspace(id: $id) {\n    id\n    requests(limit: $limit, offset: $offset) {\n      requests {\n        id\n        type\n        createdAt\n        status\n      }\n      numRequests\n    }\n  }\n}\n"): (typeof documents)["\nquery GetRequests($id: ID!, $limit: Int!, $offset: Int) {\n  workspace(id: $id) {\n    id\n    requests(limit: $limit, offset: $offset) {\n      requests {\n        id\n        type\n        createdAt\n        status\n      }\n      numRequests\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ExecuteRequest($id: ID!) {\n    executeUserDataRequest(requestId: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation ExecuteRequest($id: ID!) {\n    executeUserDataRequest(requestId: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery SiloDataSources($id: ID!) {\n  siloDefinition(id: $id) {\n    id\n    siloSpecification {\n      id\n      manual\n    }\n    dataSources {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n        userPrimaryKey {\n          id\n          name\n        }\n      }\n    }\n  }\n}\n"): (typeof documents)["\nquery SiloDataSources($id: ID!) {\n  siloDefinition(id: $id) {\n    id\n    siloSpecification {\n      id\n      manual\n    }\n    dataSources {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n        userPrimaryKey {\n          id\n          name\n        }\n      }\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSilos($id: ID!) {\n    workspace(id: $id) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          name\n          logo\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetSilos($id: ID!) {\n    workspace(id: $id) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          name\n          logo\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query DataMapQuery($workspaceId: ID!, $limit: Int!, $offset: Int, $query: DataMapQuery) {\n    workspace(id: $workspaceId) {\n      id\n      dataMap(limit: $limit, offset: $offset, query: $query) {\n        dataMapRows {\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n          property {\n            id\n            name\n            categories {\n              id\n              name\n            }\n          }\n          dataSource {\n            id\n            name\n          }\n        }\n        numRows\n      }\n    }\n  }\n"): (typeof documents)["\n  query DataMapQuery($workspaceId: ID!, $limit: Int!, $offset: Int, $query: DataMapQuery) {\n    workspace(id: $workspaceId) {\n      id\n      dataMap(limit: $limit, offset: $offset, query: $query) {\n        dataMapRows {\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n          property {\n            id\n            name\n            categories {\n              id\n              name\n            }\n          }\n          dataSource {\n            id\n            name\n          }\n        }\n        numRows\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query FilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logoUrl\n        }\n      }\n      categories {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query FilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logoUrl\n        }\n      }\n      categories {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {\n    createUserPrimaryKey(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePrimaryKey($input: CreateUserPrimaryKeyInput!) {\n    createUserPrimaryKey(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CompleteOnboarding($id: ID!) {\n    completeWorkspaceOnboarding(id: $id) {\n      id\n      onboardingComplete\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteOnboarding($id: ID!) {\n    completeWorkspaceOnboarding(id: $id) {\n      id\n      onboardingComplete\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetWorkspaces {\n    workspaces {\n      id\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspaces {\n    workspaces {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetJobStatus($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetJobStatus($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateRequest($input: UserDataRequestInput!) {\n    createUserDataRequest(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRequest($input: UserDataRequestInput!) {\n    createUserDataRequest(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetRequestMetadata($id: ID!) {\n    request(id: $id) {\n      id\n      type\n      status\n    }\n  }\n"): (typeof documents)["\n  query GetRequestMetadata($id: ID!) {\n    request(id: $id) {\n      id\n      type\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation GetRequestFile($id: ID!) {\n    generateRequestDownloadLink(requestId: $id) {\n      url\n    }\n  }\n"): (typeof documents)["\n  mutation GetRequestFile($id: ID!) {\n    generateRequestDownloadLink(requestId: $id) {\n      url\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery GetPrimaryKeyValues($id: ID!) {\n  request(id: $id) {\n    id\n    type\n    primaryKeyValues {\n      id\n      value\n      userPrimaryKey {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n}\n"): (typeof documents)["\nquery GetPrimaryKeyValues($id: ID!) {\n  request(id: $id) {\n    id\n    type\n    primaryKeyValues {\n      id\n      value\n      userPrimaryKey {\n        id\n        name\n        apiIdentifier\n      }\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query RequestFilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logo\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query RequestFilterOptionsQuery($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloDefinitions {\n        id\n        name\n        siloSpecification {\n          id\n          logo\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery GetRequestData($id: ID!, $limit: Int!, $offset: Int!, $query: RequestStatusQuery!) {\n  request(id: $id) {\n    id\n    type\n    requestStatuses(offset: $offset, limit: $limit, query: $query) {\n      numStatuses\n      requestStatusRows {\n        id\n        status\n        dataSource {\n          id\n          name\n          group\n          deleted\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        queryResult {\n          id\n          records\n          resultType\n        }\n      }\n    }\n  }\n}\n"): (typeof documents)["\nquery GetRequestData($id: ID!, $limit: Int!, $offset: Int!, $query: RequestStatusQuery!) {\n  request(id: $id) {\n    id\n    type\n    requestStatuses(offset: $offset, limit: $limit, query: $query) {\n      numStatuses\n      requestStatusRows {\n        id\n        status\n        dataSource {\n          id\n          name\n          group\n          deleted\n          siloDefinition {\n            id\n            name\n            siloSpecification {\n              id\n              name\n              logo\n            }\n          }\n        }\n        queryResult {\n          id\n          records\n          resultType\n        }\n      }\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation GetQueryResultFile($id: ID!) {\n    generateQueryResultDownloadLink(queryResultId: $id) {\n      url\n    }\n  }\n"): (typeof documents)["\n  mutation GetQueryResultFile($id: ID!) {\n    generateQueryResultDownloadLink(queryResultId: $id) {\n      url\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateRequestStatus($input: UpdateRequestStatusInput!) {\n    updateRequestStatus(input: $input) {\n      id\n      status\n      queryResult {\n        id\n        records\n        resultType\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRequestStatus($input: UpdateRequestStatusInput!) {\n    updateRequestStatus(input: $input) {\n      id\n      status\n      queryResult {\n        id\n        records\n        resultType\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSettings($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      settings\n    }\n  }\n"): (typeof documents)["\n  query GetSettings($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      settings\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateSettings($input: UpdateWorkspaceSettingsInput!) {\n    updateWorkspaceSettings(input: $input) {\n      id\n      settings\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSettings($input: UpdateWorkspaceSettingsInput!) {\n    updateWorkspaceSettings(input: $input) {\n      id\n      settings\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateSilo($input: CreateSiloDefinitionInput!) {\n    createSiloDefinition(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSilo($input: CreateSiloDefinitionInput!) {\n    createSiloDefinition(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSiloSpec($id: ID!) {\n    siloSpecification(id: $id) {\n      id\n      schema\n      manual\n    }\n  }\n"): (typeof documents)["\n  query GetSiloSpec($id: ID!) {\n    siloSpecification(id: $id) {\n      id\n      schema\n      manual\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSiloSpecs($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloSpecifications {\n        id\n        name\n        logo\n        schema\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetSiloSpecs($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      siloSpecifications {\n        id\n        name\n        logo\n        schema\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSiloTitle($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logo\n        manual\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetSiloTitle($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logo\n        manual\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCategory($id: ID!) {\n    category(id: $id) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query GetCategory($id: ID!) {\n    category(id: $id) {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query WorkspaceCategories($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query WorkspaceCategories($workspaceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ApplyDiscovery($input: HandleDiscoveryInput!) {\n    handleDiscovery(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation ApplyDiscovery($input: HandleDiscoveryInput!) {\n    handleDiscovery(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteDataSource($id: ID!) {\n    deleteDataSource(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDataSource($id: ID!) {\n    deleteDataSource(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation LinkKey($propertyId: ID!, $userPrimaryKeyId: ID) {\n    linkPropertyToPrimaryKey(propertyId: $propertyId, userPrimaryKeyId: $userPrimaryKeyId) {\n      id\n      userPrimaryKey {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation LinkKey($propertyId: ID!, $userPrimaryKeyId: ID) {\n    linkPropertyToPrimaryKey(propertyId: $propertyId, userPrimaryKeyId: $userPrimaryKeyId) {\n      id\n      userPrimaryKey {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetJob($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        logs\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetJob($workspaceId: ID!, $id: ID!) {\n    workspace(id: $workspaceId) {\n      job(\n        id: $id\n      ) {\n        id\n        logs\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateCategories($input: UpdatePropertyInput!) {\n    updateProperty(input: $input) {\n      __typename\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCategories($input: UpdatePropertyInput!) {\n    updateProperty(input: $input) {\n      __typename\n      id\n      categories {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CancelJob($id: ID!) {\n    cancelJob(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation CancelJob($id: ID!) {\n    cancelJob(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query RunningDiscoverJobs($workspaceId: ID!, $resourceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(resourceId: $resourceId, jobType: \"discover_sources\", status: [RUNNING, QUEUED], limit: 1, offset: 0) {\n        jobs {\n          id\n          jobType\n          status\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query RunningDiscoverJobs($workspaceId: ID!, $resourceId: ID!) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(resourceId: $resourceId, jobType: \"discover_sources\", status: [RUNNING, QUEUED], limit: 1, offset: 0) {\n        jobs {\n          id\n          jobType\n          status\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetNumActiveDiscoveries($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: 1, offset: 0, statuses: [OPEN]) {\n        numDiscoveries\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetNumActiveDiscoveries($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      discoveries(limit: 1, offset: 0, statuses: [OPEN]) {\n        numDiscoveries\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ApplyAllDiscoveries($input: HandleAllDiscoveriesInput!) {\n    handleAllOpenDiscoveries(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation ApplyAllDiscoveries($input: HandleAllDiscoveriesInput!) {\n    handleAllOpenDiscoveries(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSiloConfig($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logoUrl\n      }\n      siloConfig\n    }\n  }\n"): (typeof documents)["\n  query GetSiloConfig($id: ID!) {\n    siloDefinition(id: $id) {\n      id\n      name\n      siloSpecification {\n        id\n        name\n        logoUrl\n      }\n      siloConfig\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateSilo($input: UpdateSiloDefinitionInput!) {\n    updateSiloDefinition(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSilo($input: UpdateSiloDefinitionInput!) {\n    updateSiloDefinition(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateDataSource($input: CreateDataSourceInput!) {\n    createDataSource(input: $input) {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDataSource($input: CreateDataSourceInput!) {\n    createDataSource(input: $input) {\n      id\n      name\n      group\n      properties {\n        id\n        name\n        categories {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query DiscoverJobs($workspaceId: ID!, $resourceId: ID!, $limit: Int!, $offset: Int!, $query: String) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        resourceId: $resourceId,\n        jobType: \"discover_sources\",\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n        }\n        numJobs\n      }\n    }\n  }\n"): (typeof documents)["\n  query DiscoverJobs($workspaceId: ID!, $resourceId: ID!, $limit: Int!, $offset: Int!, $query: String) {\n    workspace(id: $workspaceId) {\n      id\n      jobs(\n        resourceId: $resourceId,\n        jobType: \"discover_sources\",\n        query: $query,\n        limit: $limit,\n        offset: $offset\n      ) {\n        jobs {\n          id\n          jobType\n          status\n          createdAt\n        }\n        numJobs\n      }\n    }\n  }\n"];

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
**/
export function gql(source: string): unknown;

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;