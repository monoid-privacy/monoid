/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Map: any;
  Time: any;
};

export type Category = {
  __typename?: 'Category';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type CategoryQuery = {
  anyCategory?: InputMaybe<Scalars['Boolean']>;
  categoryIDs?: InputMaybe<Array<Scalars['ID']>>;
  noCategory?: InputMaybe<Scalars['Boolean']>;
};

export type CreateCategoryInput = {
  name: Scalars['String'];
  workspaceID: Scalars['ID'];
};

export type CreateDataSourceInput = {
  description?: InputMaybe<Scalars['String']>;
  propertyIDs?: InputMaybe<Array<Scalars['ID']>>;
  siloDefinitionID: Scalars['ID'];
};

export type CreatePropertyInput = {
  categoryIDs?: InputMaybe<Array<Scalars['ID']>>;
  dataSourceID: Scalars['ID'];
  purposeIDs?: InputMaybe<Array<Scalars['ID']>>;
};

export type CreateSiloDefinitionInput = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  siloData?: InputMaybe<Scalars['String']>;
  siloSpecificationID: Scalars['ID'];
  subjectIDs?: InputMaybe<Array<Scalars['ID']>>;
  workspaceID: Scalars['ID'];
};

export type CreateSiloSpecificationInput = {
  dockerImage: Scalars['String'];
  logoURL?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  schema?: InputMaybe<Scalars['String']>;
  workspaceID: Scalars['ID'];
};

export type CreateSubjectInput = {
  name: Scalars['String'];
  workspaceID: Scalars['ID'];
};

export type CreateUserPrimaryKeyInput = {
  apiIdentifier: Scalars['String'];
  name: Scalars['String'];
  workspaceId: Scalars['ID'];
};

export type CreateWorkspaceInput = {
  name: Scalars['String'];
  settings?: InputMaybe<Array<InputMaybe<KvPair>>>;
};

export type DataDiscoveriesListResult = {
  __typename?: 'DataDiscoveriesListResult';
  discoveries: Array<Maybe<DataDiscovery>>;
  numDiscoveries: Scalars['Int'];
};

export type DataDiscovery = {
  __typename?: 'DataDiscovery';
  createdAt: Scalars['Time'];
  data: DataDiscoveryData;
  id: Scalars['ID'];
  siloDefinition: SiloDefinition;
  siloDefinitionID: Scalars['ID'];
  status: DiscoveryStatus;
  type: DiscoveryType;
};

export type DataDiscoveryData = DataSourceMissingDiscovery | NewCategoryDiscovery | NewDataSourceDiscovery | NewPropertyDiscovery | PropertyMissingDiscovery;

export type DataMapQuery = {
  categories?: InputMaybe<CategoryQuery>;
  siloDefinitions?: InputMaybe<Array<Scalars['ID']>>;
};

export type DataMapResult = {
  __typename?: 'DataMapResult';
  dataMapRows?: Maybe<Array<DataMapRow>>;
  numRows: Scalars['Int'];
};

export type DataMapRow = {
  __typename?: 'DataMapRow';
  dataSource: DataSource;
  property: Property;
  siloDefinition: SiloDefinition;
};

export type DataSource = {
  __typename?: 'DataSource';
  description?: Maybe<Scalars['String']>;
  group?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  properties?: Maybe<Array<Property>>;
  requestStatuses: Array<RequestStatus>;
  siloDefinition: SiloDefinition;
};

export type DataSourceMissingDiscovery = {
  __typename?: 'DataSourceMissingDiscovery';
  dataSource?: Maybe<DataSource>;
  id: Scalars['String'];
};

export enum DiscoveryAction {
  Accept = 'ACCEPT',
  Reject = 'REJECT'
}

export enum DiscoveryStatus {
  Accepted = 'ACCEPTED',
  Open = 'OPEN',
  Rejected = 'REJECTED'
}

export enum DiscoveryType {
  CategoryFound = 'CATEGORY_FOUND',
  DataSourceFound = 'DATA_SOURCE_FOUND',
  DataSourceMissing = 'DATA_SOURCE_MISSING',
  PropertyFound = 'PROPERTY_FOUND',
  PropertyMissing = 'PROPERTY_MISSING'
}

export type DownloadLink = {
  __typename?: 'DownloadLink';
  url: Scalars['String'];
};

export enum FullRequestStatus {
  Created = 'CREATED',
  Executed = 'EXECUTED',
  Failed = 'FAILED',
  InProgress = 'IN_PROGRESS',
  PartialFailed = 'PARTIAL_FAILED'
}

export type HandleAllDiscoveriesInput = {
  action: DiscoveryAction;
  siloId: Scalars['ID'];
};

export type HandleDiscoveryInput = {
  action: DiscoveryAction;
  discoveryId: Scalars['ID'];
};

export type Job = {
  __typename?: 'Job';
  createdAt: Scalars['Time'];
  id: Scalars['ID'];
  jobType: Scalars['String'];
  logs?: Maybe<Array<Scalars['String']>>;
  resourceId: Scalars['ID'];
  siloDefinition: SiloDefinition;
  status: JobStatus;
  updatedAt: Scalars['Time'];
};

export enum JobStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  PartialFailed = 'PARTIAL_FAILED',
  Queued = 'QUEUED',
  Running = 'RUNNING'
}

export type JobsResult = {
  __typename?: 'JobsResult';
  jobs: Array<Job>;
  numJobs: Scalars['Int'];
};

export type KvPair = {
  key: Scalars['String'];
  value: Scalars['String'];
};

export type MonoidRecordResponse = {
  __typename?: 'MonoidRecordResponse';
  SchemaGroup?: Maybe<Scalars['String']>;
  SchemaName: Scalars['String'];
  data: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cancelJob?: Maybe<Job>;
  completeWorkspaceOnboarding: Workspace;
  createDataSource?: Maybe<DataSource>;
  createProperty?: Maybe<Property>;
  createSiloDefinition: SiloDefinition;
  createSiloSpecification?: Maybe<SiloSpecification>;
  createSubject?: Maybe<Subject>;
  createUserDataRequest?: Maybe<Request>;
  createUserPrimaryKey?: Maybe<UserPrimaryKey>;
  createWorkspace: Workspace;
  deleteDataSource?: Maybe<Scalars['ID']>;
  deleteProperty?: Maybe<Scalars['ID']>;
  deleteSiloDefinition: Scalars['ID'];
  deleteSiloSpecification?: Maybe<Scalars['ID']>;
  deleteSubject?: Maybe<Scalars['ID']>;
  deleteUserPrimaryKey?: Maybe<Scalars['ID']>;
  deleteWorkspace: Scalars['ID'];
  detectSiloSources: Job;
  executeUserDataRequest?: Maybe<Request>;
  generateQueryResultDownloadLink: DownloadLink;
  generateRequestDownloadLink: DownloadLink;
  handleAllOpenDiscoveries?: Maybe<Array<Maybe<DataDiscovery>>>;
  handleDiscovery?: Maybe<DataDiscovery>;
  linkPropertyToPrimaryKey?: Maybe<Property>;
  updateDataSource?: Maybe<DataSource>;
  updateProperty?: Maybe<Property>;
  updateSiloDefinition: SiloDefinition;
  updateSiloSpecification?: Maybe<SiloSpecification>;
  updateSubject?: Maybe<Subject>;
  updateUserPrimaryKey?: Maybe<UserPrimaryKey>;
  updateWorkspaceSettings: Workspace;
};


export type MutationCancelJobArgs = {
  id: Scalars['ID'];
};


export type MutationCompleteWorkspaceOnboardingArgs = {
  id: Scalars['ID'];
};


export type MutationCreateDataSourceArgs = {
  input?: InputMaybe<CreateDataSourceInput>;
};


export type MutationCreatePropertyArgs = {
  input?: InputMaybe<CreatePropertyInput>;
};


export type MutationCreateSiloDefinitionArgs = {
  input?: InputMaybe<CreateSiloDefinitionInput>;
};


export type MutationCreateSiloSpecificationArgs = {
  input?: InputMaybe<CreateSiloSpecificationInput>;
};


export type MutationCreateSubjectArgs = {
  input?: InputMaybe<CreateSubjectInput>;
};


export type MutationCreateUserDataRequestArgs = {
  input?: InputMaybe<UserDataRequestInput>;
};


export type MutationCreateUserPrimaryKeyArgs = {
  input: CreateUserPrimaryKeyInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationDeleteDataSourceArgs = {
  id: Scalars['ID'];
};


export type MutationDeletePropertyArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteSiloDefinitionArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteSiloSpecificationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteSubjectArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteUserPrimaryKeyArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['ID'];
};


export type MutationDetectSiloSourcesArgs = {
  id: Scalars['ID'];
  workspaceId: Scalars['ID'];
};


export type MutationExecuteUserDataRequestArgs = {
  requestId: Scalars['ID'];
};


export type MutationGenerateQueryResultDownloadLinkArgs = {
  queryResultId: Scalars['ID'];
};


export type MutationGenerateRequestDownloadLinkArgs = {
  requestId: Scalars['ID'];
};


export type MutationHandleAllOpenDiscoveriesArgs = {
  input?: InputMaybe<HandleAllDiscoveriesInput>;
};


export type MutationHandleDiscoveryArgs = {
  input?: InputMaybe<HandleDiscoveryInput>;
};


export type MutationLinkPropertyToPrimaryKeyArgs = {
  propertyId: Scalars['ID'];
  userPrimaryKeyId?: InputMaybe<Scalars['ID']>;
};


export type MutationUpdateDataSourceArgs = {
  input?: InputMaybe<UpdateDataSourceInput>;
};


export type MutationUpdatePropertyArgs = {
  input?: InputMaybe<UpdatePropertyInput>;
};


export type MutationUpdateSiloDefinitionArgs = {
  input?: InputMaybe<UpdateSiloDefinitionInput>;
};


export type MutationUpdateSiloSpecificationArgs = {
  input?: InputMaybe<UpdateSiloSpecificationInput>;
};


export type MutationUpdateSubjectArgs = {
  input?: InputMaybe<UpdateSubjectInput>;
};


export type MutationUpdateUserPrimaryKeyArgs = {
  input: UpdateUserPrimaryKeyInput;
};


export type MutationUpdateWorkspaceSettingsArgs = {
  input: UpdateWorkspaceSettingsInput;
};

export type NewCategoryDiscovery = {
  __typename?: 'NewCategoryDiscovery';
  category: Category;
  categoryId: Scalars['String'];
  property?: Maybe<Property>;
  propertyId?: Maybe<Scalars['String']>;
};

export type NewDataSourceDiscovery = {
  __typename?: 'NewDataSourceDiscovery';
  group?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  properties?: Maybe<Array<Maybe<NewPropertyDiscovery>>>;
};

export type NewPropertyDiscovery = {
  __typename?: 'NewPropertyDiscovery';
  categories?: Maybe<Array<Maybe<NewCategoryDiscovery>>>;
  dataSource?: Maybe<DataSource>;
  dataSourceId?: Maybe<Scalars['String']>;
  name: Scalars['String'];
};

export type PrimaryKeyValue = {
  __typename?: 'PrimaryKeyValue';
  id: Scalars['ID'];
  request: Request;
  userPrimaryKey: UserPrimaryKey;
  value: Scalars['String'];
};

export type Property = {
  __typename?: 'Property';
  categories?: Maybe<Array<Category>>;
  dataSource: DataSource;
  id: Scalars['ID'];
  name: Scalars['String'];
  userPrimaryKey?: Maybe<UserPrimaryKey>;
};

export type PropertyMissingDiscovery = {
  __typename?: 'PropertyMissingDiscovery';
  id: Scalars['String'];
  property?: Maybe<Property>;
};

export type Query = {
  __typename?: 'Query';
  category: Category;
  dataSource: DataSource;
  primaryKeyValue: PrimaryKeyValue;
  property: Property;
  request: Request;
  requestStatus: RequestStatus;
  siloDefinition: SiloDefinition;
  siloSpecification: SiloSpecification;
  subject: Subject;
  userPrimaryKey: UserPrimaryKey;
  workspace: Workspace;
  workspaces: Array<Maybe<Workspace>>;
};


export type QueryCategoryArgs = {
  id: Scalars['ID'];
};


export type QueryDataSourceArgs = {
  id: Scalars['ID'];
};


export type QueryPrimaryKeyValueArgs = {
  id: Scalars['ID'];
};


export type QueryPropertyArgs = {
  id: Scalars['ID'];
};


export type QueryRequestArgs = {
  id: Scalars['ID'];
};


export type QueryRequestStatusArgs = {
  id: Scalars['ID'];
};


export type QuerySiloDefinitionArgs = {
  id: Scalars['ID'];
};


export type QuerySiloSpecificationArgs = {
  id: Scalars['ID'];
};


export type QuerySubjectArgs = {
  id: Scalars['ID'];
};


export type QueryUserPrimaryKeyArgs = {
  id: Scalars['ID'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['ID'];
};

export type QueryResult = {
  __typename?: 'QueryResult';
  id: Scalars['ID'];
  records?: Maybe<Scalars['String']>;
  requestStatus: RequestStatus;
  resultType: ResultType;
};

export type Request = {
  __typename?: 'Request';
  createdAt: Scalars['Time'];
  id: Scalars['ID'];
  primaryKeyValues: Array<PrimaryKeyValue>;
  requestStatuses: RequestStatusListResult;
  status: FullRequestStatus;
  type: UserDataRequestType;
};


export type RequestRequestStatusesArgs = {
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<RequestStatusQuery>;
};

export type RequestStatus = {
  __typename?: 'RequestStatus';
  dataSource: DataSource;
  id: Scalars['ID'];
  queryResult?: Maybe<QueryResult>;
  request: Request;
  status: RequestStatusType;
};

export type RequestStatusListResult = {
  __typename?: 'RequestStatusListResult';
  numStatuses: Scalars['Int'];
  requestStatusRows?: Maybe<Array<RequestStatus>>;
};

export type RequestStatusQuery = {
  siloDefinitions?: InputMaybe<Array<Scalars['ID']>>;
};

export enum RequestStatusType {
  Created = 'CREATED',
  Executed = 'EXECUTED',
  Failed = 'FAILED',
  InProgress = 'IN_PROGRESS'
}

export type RequestsResult = {
  __typename?: 'RequestsResult';
  numRequests: Scalars['Int'];
  requests: Array<Request>;
};

export enum ResultType {
  File = 'FILE',
  RecordsJson = 'RECORDS_JSON'
}

export type SiloDefinition = {
  __typename?: 'SiloDefinition';
  dataSources?: Maybe<Array<DataSource>>;
  description?: Maybe<Scalars['String']>;
  /**
   * List the discoveries for a silo. If a query is specified, it is used to look up
   * a discovery by ID.
   */
  discoveries: DataDiscoveriesListResult;
  id: Scalars['ID'];
  name: Scalars['String'];
  siloConfig?: Maybe<Scalars['Map']>;
  siloSpecification?: Maybe<SiloSpecification>;
  subjects?: Maybe<Array<Subject>>;
};


export type SiloDefinitionDiscoveriesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
  statuses?: InputMaybe<Array<InputMaybe<DiscoveryStatus>>>;
};

export type SiloSpecification = {
  __typename?: 'SiloSpecification';
  dockerImage: Scalars['String'];
  id: Scalars['ID'];
  logo?: Maybe<Scalars['String']>;
  logoUrl?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  schema?: Maybe<Scalars['String']>;
};

export type Subject = {
  __typename?: 'Subject';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type UpdateCategoryInput = {
  name?: InputMaybe<Scalars['String']>;
};

export type UpdateDataSourceInput = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type UpdatePropertyInput = {
  categoryIDs?: InputMaybe<Array<Scalars['ID']>>;
  id: Scalars['ID'];
  purposeIDs?: InputMaybe<Array<Scalars['ID']>>;
};

export type UpdateSiloDefinitionInput = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  siloData?: InputMaybe<Scalars['String']>;
  subjectIDs?: InputMaybe<Array<Scalars['ID']>>;
};

export type UpdateSiloSpecificationInput = {
  dockerImage?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  logoUrl?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  schema?: InputMaybe<Scalars['String']>;
};

export type UpdateSubjectInput = {
  name?: InputMaybe<Scalars['String']>;
};

export type UpdateUserPrimaryKeyInput = {
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type UpdateWorkspaceSettingsInput = {
  settings?: InputMaybe<Array<InputMaybe<KvPair>>>;
  workspaceID: Scalars['ID'];
};

export type UserDataRequestInput = {
  primaryKeys?: InputMaybe<Array<UserPrimaryKeyInput>>;
  type: UserDataRequestType;
  workspaceId: Scalars['ID'];
};

export enum UserDataRequestType {
  Delete = 'DELETE',
  Query = 'QUERY'
}

export type UserPrimaryKey = {
  __typename?: 'UserPrimaryKey';
  apiIdentifier: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  properties?: Maybe<Array<Property>>;
  workspaceId: Scalars['ID'];
};

export type UserPrimaryKeyInput = {
  apiIdentifier: Scalars['String'];
  value: Scalars['String'];
};

export type Workspace = {
  __typename?: 'Workspace';
  categories: Array<Category>;
  dataMap: DataMapResult;
  discoveries: DataDiscoveriesListResult;
  id: Scalars['ID'];
  job: Job;
  jobs: JobsResult;
  name?: Maybe<Scalars['String']>;
  onboardingComplete?: Maybe<Scalars['Boolean']>;
  requests: RequestsResult;
  settings: Scalars['Map'];
  siloDefinitions: Array<SiloDefinition>;
  siloSpecifications: Array<SiloSpecification>;
  subjects: Array<Subject>;
  userPrimaryKeys: Array<UserPrimaryKey>;
};


export type WorkspaceDataMapArgs = {
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<DataMapQuery>;
};


export type WorkspaceDiscoveriesArgs = {
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  statuses?: InputMaybe<Array<InputMaybe<DiscoveryStatus>>>;
};


export type WorkspaceJobArgs = {
  id: Scalars['ID'];
};


export type WorkspaceJobsArgs = {
  jobType: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
  resourceId?: InputMaybe<Scalars['ID']>;
  status?: InputMaybe<Array<InputMaybe<JobStatus>>>;
};


export type WorkspaceRequestsArgs = {
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
};

export type WorkspaceQueryQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type WorkspaceQueryQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, name?: string | null, onboardingComplete?: boolean | null } };

export type DataSourceFieldsFragment = { __typename?: 'DataSource', id: string, name: string, group?: string | null };

export type PropertyFieldsFragment = { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } };

export type CategoryFieldsFragment = { __typename?: 'Category', id: string, name: string };

export type DiscoveryFieldsFragment = { __typename?: 'DataDiscovery', id: string, type: DiscoveryType, status: DiscoveryStatus, createdAt: any, data: { __typename: 'DataSourceMissingDiscovery', id: string, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null } | { __typename: 'NewCategoryDiscovery', propertyId?: string | null, categoryId: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null, category: { __typename?: 'Category', id: string, name: string } } | { __typename: 'NewDataSourceDiscovery', name: string, group?: string | null, properties?: Array<{ __typename?: 'NewPropertyDiscovery', name: string, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | null> | null } | { __typename: 'NewPropertyDiscovery', name: string, dataSourceId?: string | null, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | { __typename: 'PropertyMissingDiscovery', id: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null } };

export type GetWorkspaceDiscoveriesQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  statuses?: InputMaybe<Array<InputMaybe<DiscoveryStatus>> | InputMaybe<DiscoveryStatus>>;
  query?: InputMaybe<Scalars['String']>;
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
}>;


export type GetWorkspaceDiscoveriesQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, discoveries: { __typename?: 'DataDiscoveriesListResult', numDiscoveries: number, discoveries: Array<{ __typename?: 'DataDiscovery', id: string, type: DiscoveryType, status: DiscoveryStatus, createdAt: any, siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null }, data: { __typename: 'DataSourceMissingDiscovery', id: string, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null } | { __typename: 'NewCategoryDiscovery', propertyId?: string | null, categoryId: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null, category: { __typename?: 'Category', id: string, name: string } } | { __typename: 'NewDataSourceDiscovery', name: string, group?: string | null, properties?: Array<{ __typename?: 'NewPropertyDiscovery', name: string, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | null> | null } | { __typename: 'NewPropertyDiscovery', name: string, dataSourceId?: string | null, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | { __typename: 'PropertyMissingDiscovery', id: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null } } | null> } } };

export type GetDiscoveriesQueryVariables = Exact<{
  id: Scalars['ID'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
  statuses?: InputMaybe<Array<InputMaybe<DiscoveryStatus>> | InputMaybe<DiscoveryStatus>>;
}>;


export type GetDiscoveriesQuery = { __typename?: 'Query', siloDefinition: { __typename?: 'SiloDefinition', id: string, discoveries: { __typename?: 'DataDiscoveriesListResult', numDiscoveries: number, discoveries: Array<{ __typename?: 'DataDiscovery', id: string, type: DiscoveryType, status: DiscoveryStatus, createdAt: any, data: { __typename: 'DataSourceMissingDiscovery', id: string, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null } | { __typename: 'NewCategoryDiscovery', propertyId?: string | null, categoryId: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null, category: { __typename?: 'Category', id: string, name: string } } | { __typename: 'NewDataSourceDiscovery', name: string, group?: string | null, properties?: Array<{ __typename?: 'NewPropertyDiscovery', name: string, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | null> | null } | { __typename: 'NewPropertyDiscovery', name: string, dataSourceId?: string | null, dataSource?: { __typename?: 'DataSource', id: string, name: string, group?: string | null } | null, categories?: Array<{ __typename?: 'NewCategoryDiscovery', categoryId: string, category: { __typename?: 'Category', id: string, name: string } } | null> | null } | { __typename: 'PropertyMissingDiscovery', id: string, property?: { __typename?: 'Property', id: string, name: string, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null } } | null } } | null> } } };

export type GetWorkspaceScansQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  status?: InputMaybe<Array<InputMaybe<JobStatus>> | InputMaybe<JobStatus>>;
  query?: InputMaybe<Scalars['String']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type GetWorkspaceScansQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, jobs: { __typename?: 'JobsResult', numJobs: number, jobs: Array<{ __typename?: 'Job', id: string, jobType: string, status: JobStatus, createdAt: any, siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null } }> } } };

export type RunSourceScanMutationVariables = Exact<{
  id: Scalars['ID'];
  workspaceId: Scalars['ID'];
}>;


export type RunSourceScanMutation = { __typename?: 'Mutation', detectSiloSources: { __typename?: 'Job', id: string, status: JobStatus, jobType: string } };

export type GetPrimaryKeysQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetPrimaryKeysQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, userPrimaryKeys: Array<{ __typename?: 'UserPrimaryKey', id: string, name: string, apiIdentifier: string }> } };

export type GetRequestsQueryVariables = Exact<{
  id: Scalars['ID'];
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
}>;


export type GetRequestsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, requests: { __typename?: 'RequestsResult', numRequests: number, requests: Array<{ __typename?: 'Request', id: string, type: UserDataRequestType, createdAt: any, status: FullRequestStatus }> } } };

export type ExecuteRequestMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ExecuteRequestMutation = { __typename?: 'Mutation', executeUserDataRequest?: { __typename?: 'Request', id: string, status: FullRequestStatus } | null };

export type SiloDataSourcesQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type SiloDataSourcesQuery = { __typename?: 'Query', siloDefinition: { __typename?: 'SiloDefinition', id: string, dataSources?: Array<{ __typename?: 'DataSource', id: string, name: string, group?: string | null, properties?: Array<{ __typename?: 'Property', id: string, name: string, categories?: Array<{ __typename?: 'Category', id: string, name: string }> | null, userPrimaryKey?: { __typename?: 'UserPrimaryKey', id: string, name: string } | null }> | null }> | null } };

export type GetSilosQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSilosQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, siloDefinitions: Array<{ __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null }> } };

export type DataMapQueryQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  limit: Scalars['Int'];
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<DataMapQuery>;
}>;


export type DataMapQueryQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, dataMap: { __typename?: 'DataMapResult', numRows: number, dataMapRows?: Array<{ __typename?: 'DataMapRow', siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null }, property: { __typename?: 'Property', id: string, name: string, categories?: Array<{ __typename?: 'Category', id: string, name: string }> | null }, dataSource: { __typename?: 'DataSource', id: string, name: string } }> | null } } };

export type FilterOptionsQueryQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
}>;


export type FilterOptionsQueryQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, siloDefinitions: Array<{ __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, logoUrl?: string | null } | null }>, categories: Array<{ __typename?: 'Category', id: string, name: string }> } };

export type CreatePrimaryKeyMutationVariables = Exact<{
  input: CreateUserPrimaryKeyInput;
}>;


export type CreatePrimaryKeyMutation = { __typename?: 'Mutation', createUserPrimaryKey?: { __typename?: 'UserPrimaryKey', id: string } | null };

export type CompleteOnboardingMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type CompleteOnboardingMutation = { __typename?: 'Mutation', completeWorkspaceOnboarding: { __typename?: 'Workspace', id: string, onboardingComplete?: boolean | null } };

export type CreateWorkspaceMutationVariables = Exact<{
  input: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { __typename?: 'Mutation', createWorkspace: { __typename?: 'Workspace', id: string } };

export type GetWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorkspacesQuery = { __typename?: 'Query', workspaces: Array<{ __typename?: 'Workspace', id: string } | null> };

export type GetJobStatusQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  id: Scalars['ID'];
}>;


export type GetJobStatusQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', job: { __typename?: 'Job', id: string, status: JobStatus } } };

export type CreateRequestMutationVariables = Exact<{
  input: UserDataRequestInput;
}>;


export type CreateRequestMutation = { __typename?: 'Mutation', createUserDataRequest?: { __typename?: 'Request', id: string } | null };

export type GetRequestMetadataQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetRequestMetadataQuery = { __typename?: 'Query', request: { __typename?: 'Request', id: string, type: UserDataRequestType, status: FullRequestStatus } };

export type GetRequestFileMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetRequestFileMutation = { __typename?: 'Mutation', generateRequestDownloadLink: { __typename?: 'DownloadLink', url: string } };

export type GetPrimaryKeyValuesQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetPrimaryKeyValuesQuery = { __typename?: 'Query', request: { __typename?: 'Request', id: string, type: UserDataRequestType, primaryKeyValues: Array<{ __typename?: 'PrimaryKeyValue', id: string, value: string, userPrimaryKey: { __typename?: 'UserPrimaryKey', id: string, name: string, apiIdentifier: string } }> } };

export type RequestFilterOptionsQueryQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
}>;


export type RequestFilterOptionsQueryQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, siloDefinitions: Array<{ __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, logo?: string | null } | null }> } };

export type GetRequestDataQueryVariables = Exact<{
  id: Scalars['ID'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  query: RequestStatusQuery;
}>;


export type GetRequestDataQuery = { __typename?: 'Query', request: { __typename?: 'Request', id: string, type: UserDataRequestType, requestStatuses: { __typename?: 'RequestStatusListResult', numStatuses: number, requestStatusRows?: Array<{ __typename?: 'RequestStatus', id: string, status: RequestStatusType, dataSource: { __typename?: 'DataSource', id: string, name: string, group?: string | null, siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null } }, queryResult?: { __typename?: 'QueryResult', id: string, records?: string | null, resultType: ResultType } | null }> | null } } };

export type GetQueryResultFileMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetQueryResultFileMutation = { __typename?: 'Mutation', generateQueryResultDownloadLink: { __typename?: 'DownloadLink', url: string } };

export type GetSettingsQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
}>;


export type GetSettingsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, settings: any } };

export type UpdateSettingsMutationVariables = Exact<{
  input: UpdateWorkspaceSettingsInput;
}>;


export type UpdateSettingsMutation = { __typename?: 'Mutation', updateWorkspaceSettings: { __typename?: 'Workspace', id: string, settings: any } };

export type CreateSiloMutationVariables = Exact<{
  input: CreateSiloDefinitionInput;
}>;


export type CreateSiloMutation = { __typename?: 'Mutation', createSiloDefinition: { __typename?: 'SiloDefinition', id: string } };

export type GetSiloSpecQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSiloSpecQuery = { __typename?: 'Query', siloSpecification: { __typename?: 'SiloSpecification', id: string, schema?: string | null } };

export type GetSiloSpecsQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
}>;


export type GetSiloSpecsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, siloSpecifications: Array<{ __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null, schema?: string | null }> } };

export type GetSiloTitleQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSiloTitleQuery = { __typename?: 'Query', siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logo?: string | null } | null } };

export type GetCategoryQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetCategoryQuery = { __typename?: 'Query', category: { __typename?: 'Category', id: string, name: string } };

export type WorkspaceCategoriesQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
}>;


export type WorkspaceCategoriesQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, categories: Array<{ __typename?: 'Category', id: string, name: string }> } };

export type UpdateCategoriesMutationVariables = Exact<{
  input: UpdatePropertyInput;
}>;


export type UpdateCategoriesMutation = { __typename?: 'Mutation', updateProperty?: { __typename: 'Property', id: string, categories?: Array<{ __typename?: 'Category', id: string, name: string }> | null } | null };

export type ApplyDiscoveryMutationVariables = Exact<{
  input: HandleDiscoveryInput;
}>;


export type ApplyDiscoveryMutation = { __typename?: 'Mutation', handleDiscovery?: { __typename?: 'DataDiscovery', id: string, status: DiscoveryStatus } | null };

export type LinkKeyMutationVariables = Exact<{
  propertyId: Scalars['ID'];
  userPrimaryKeyId?: InputMaybe<Scalars['ID']>;
}>;


export type LinkKeyMutation = { __typename?: 'Mutation', linkPropertyToPrimaryKey?: { __typename?: 'Property', id: string, userPrimaryKey?: { __typename?: 'UserPrimaryKey', id: string, name: string } | null } | null };

export type GetJobQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  id: Scalars['ID'];
}>;


export type GetJobQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', job: { __typename?: 'Job', id: string, logs?: Array<string> | null } } };

export type CancelJobMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type CancelJobMutation = { __typename?: 'Mutation', cancelJob?: { __typename?: 'Job', id: string, status: JobStatus } | null };

export type RunningDiscoverJobsQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  resourceId: Scalars['ID'];
}>;


export type RunningDiscoverJobsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, jobs: { __typename?: 'JobsResult', jobs: Array<{ __typename?: 'Job', id: string, jobType: string, status: JobStatus }> } } };

export type GetNumActiveDiscoveriesQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetNumActiveDiscoveriesQuery = { __typename?: 'Query', siloDefinition: { __typename?: 'SiloDefinition', id: string, discoveries: { __typename?: 'DataDiscoveriesListResult', numDiscoveries: number } } };

export type ApplyAllDiscoveriesMutationVariables = Exact<{
  input: HandleAllDiscoveriesInput;
}>;


export type ApplyAllDiscoveriesMutation = { __typename?: 'Mutation', handleAllOpenDiscoveries?: Array<{ __typename?: 'DataDiscovery', id: string, status: DiscoveryStatus } | null> | null };

export type GetSiloConfigQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetSiloConfigQuery = { __typename?: 'Query', siloDefinition: { __typename?: 'SiloDefinition', id: string, name: string, siloConfig?: any | null, siloSpecification?: { __typename?: 'SiloSpecification', id: string, name: string, logoUrl?: string | null } | null } };

export type UpdateSiloMutationVariables = Exact<{
  input: UpdateSiloDefinitionInput;
}>;


export type UpdateSiloMutation = { __typename?: 'Mutation', updateSiloDefinition: { __typename?: 'SiloDefinition', id: string } };

export type DiscoverJobsQueryVariables = Exact<{
  workspaceId: Scalars['ID'];
  resourceId: Scalars['ID'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  query?: InputMaybe<Scalars['String']>;
}>;


export type DiscoverJobsQuery = { __typename?: 'Query', workspace: { __typename?: 'Workspace', id: string, jobs: { __typename?: 'JobsResult', numJobs: number, jobs: Array<{ __typename?: 'Job', id: string, jobType: string, status: JobStatus, createdAt: any }> } } };

export const CategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Category"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode<CategoryFieldsFragment, unknown>;
export const DataSourceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}}]}}]} as unknown as DocumentNode<DataSourceFieldsFragment, unknown>;
export const PropertyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PropertyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Property"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFields"}}]}}]}}]} as unknown as DocumentNode<PropertyFieldsFragment, unknown>;
export const DiscoveryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DiscoveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NewDataSourceDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NewPropertyDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NewCategoryDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"property"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PropertyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PropertyMissingDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"property"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PropertyFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSourceMissingDiscovery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFields"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DiscoveryFieldsFragment, unknown>;
export const WorkspaceQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingComplete"}}]}}]}}]} as unknown as DocumentNode<WorkspaceQueryQuery, WorkspaceQueryQueryVariables>;
export const GetWorkspaceDiscoveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceDiscoveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DiscoveryStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"discoveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discoveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DiscoveryFields"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"numDiscoveries"}}]}}]}}]}},...DiscoveryFieldsFragmentDoc.definitions,...CategoryFieldsFragmentDoc.definitions,...DataSourceFieldsFragmentDoc.definitions,...PropertyFieldsFragmentDoc.definitions]} as unknown as DocumentNode<GetWorkspaceDiscoveriesQuery, GetWorkspaceDiscoveriesQueryVariables>;
export const GetDiscoveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDiscoveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DiscoveryStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"discoveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discoveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DiscoveryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"numDiscoveries"}}]}}]}}]}},...DiscoveryFieldsFragmentDoc.definitions,...CategoryFieldsFragmentDoc.definitions,...DataSourceFieldsFragmentDoc.definitions,...PropertyFieldsFragmentDoc.definitions]} as unknown as DocumentNode<GetDiscoveriesQuery, GetDiscoveriesQueryVariables>;
export const GetWorkspaceScansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaceScans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"jobType"},"value":{"kind":"StringValue","value":"discover_sources","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"numJobs"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceScansQuery, GetWorkspaceScansQueryVariables>;
export const RunSourceScanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RunSourceScan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"detectSiloSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}}]}}]}}]} as unknown as DocumentNode<RunSourceScanMutation, RunSourceScanMutationVariables>;
export const GetPrimaryKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPrimaryKeys"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userPrimaryKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"apiIdentifier"}}]}}]}}]}}]} as unknown as DocumentNode<GetPrimaryKeysQuery, GetPrimaryKeysQueryVariables>;
export const GetRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"numRequests"}}]}}]}}]}}]} as unknown as DocumentNode<GetRequestsQuery, GetRequestsQueryVariables>;
export const ExecuteRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExecuteRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeUserDataRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ExecuteRequestMutation, ExecuteRequestMutationVariables>;
export const SiloDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SiloDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"userPrimaryKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<SiloDataSourcesQuery, SiloDataSourcesQueryVariables>;
export const GetSilosDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSilos"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSilosQuery, GetSilosQueryVariables>;
export const DataMapQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DataMapQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DataMapQuery"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataMapRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"property"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"numRows"}}]}}]}}]}}]} as unknown as DocumentNode<DataMapQueryQuery, DataMapQueryQueryVariables>;
export const FilterOptionsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FilterOptionsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<FilterOptionsQueryQuery, FilterOptionsQueryQueryVariables>;
export const CreatePrimaryKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePrimaryKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserPrimaryKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserPrimaryKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreatePrimaryKeyMutation, CreatePrimaryKeyMutationVariables>;
export const CompleteOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeWorkspaceOnboarding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingComplete"}}]}}]}}]} as unknown as DocumentNode<CompleteOnboardingMutation, CompleteOnboardingMutationVariables>;
export const CreateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkspaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const GetJobStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetJobStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"job"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<GetJobStatusQuery, GetJobStatusQueryVariables>;
export const CreateRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDataRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserDataRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateRequestMutation, CreateRequestMutationVariables>;
export const GetRequestMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRequestMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"request"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<GetRequestMetadataQuery, GetRequestMetadataQueryVariables>;
export const GetRequestFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetRequestFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateRequestDownloadLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GetRequestFileMutation, GetRequestFileMutationVariables>;
export const GetPrimaryKeyValuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPrimaryKeyValues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"request"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"primaryKeyValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"userPrimaryKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"apiIdentifier"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPrimaryKeyValuesQuery, GetPrimaryKeyValuesQueryVariables>;
export const RequestFilterOptionsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RequestFilterOptionsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RequestFilterOptionsQueryQuery, RequestFilterOptionsQueryQueryVariables>;
export const GetRequestDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRequestData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestStatusQuery"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"request"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"requestStatuses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"numStatuses"}},{"kind":"Field","name":{"kind":"Name","value":"requestStatusRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"queryResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"records"}},{"kind":"Field","name":{"kind":"Name","value":"resultType"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRequestDataQuery, GetRequestDataQueryVariables>;
export const GetQueryResultFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetQueryResultFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateQueryResultDownloadLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"queryResultId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GetQueryResultFileMutation, GetQueryResultFileMutationVariables>;
export const GetSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}}]}}]}}]} as unknown as DocumentNode<GetSettingsQuery, GetSettingsQueryVariables>;
export const UpdateSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWorkspaceSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkspaceSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingsMutation, UpdateSettingsMutationVariables>;
export const CreateSiloDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSilo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSiloDefinitionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSiloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSiloMutation, CreateSiloMutationVariables>;
export const GetSiloSpecDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiloSpec"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schema"}}]}}]}}]} as unknown as DocumentNode<GetSiloSpecQuery, GetSiloSpecQueryVariables>;
export const GetSiloSpecsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiloSpecs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"schema"}}]}}]}}]}}]} as unknown as DocumentNode<GetSiloSpecsQuery, GetSiloSpecsQueryVariables>;
export const GetSiloTitleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiloTitle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]}}]} as unknown as DocumentNode<GetSiloTitleQuery, GetSiloTitleQueryVariables>;
export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"category"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;
export const WorkspaceCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<WorkspaceCategoriesQuery, WorkspaceCategoriesQueryVariables>;
export const UpdateCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePropertyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProperty"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCategoriesMutation, UpdateCategoriesMutationVariables>;
export const ApplyDiscoveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApplyDiscovery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HandleDiscoveryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"handleDiscovery"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ApplyDiscoveryMutation, ApplyDiscoveryMutationVariables>;
export const LinkKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"propertyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userPrimaryKeyId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkPropertyToPrimaryKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"propertyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"propertyId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userPrimaryKeyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userPrimaryKeyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userPrimaryKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<LinkKeyMutation, LinkKeyMutationVariables>;
export const GetJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"job"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logs"}}]}}]}}]}}]} as unknown as DocumentNode<GetJobQuery, GetJobQueryVariables>;
export const CancelJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelJobMutation, CancelJobMutationVariables>;
export const RunningDiscoverJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RunningDiscoverJobs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"jobType"},"value":{"kind":"StringValue","value":"discover_sources","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"RUNNING"},{"kind":"EnumValue","value":"QUEUED"}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RunningDiscoverJobsQuery, RunningDiscoverJobsQueryVariables>;
export const GetNumActiveDiscoveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNumActiveDiscoveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"discoveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}},{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"OPEN"}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"numDiscoveries"}}]}}]}}]}}]} as unknown as DocumentNode<GetNumActiveDiscoveriesQuery, GetNumActiveDiscoveriesQueryVariables>;
export const ApplyAllDiscoveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApplyAllDiscoveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HandleAllDiscoveriesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"handleAllOpenDiscoveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ApplyAllDiscoveriesMutation, ApplyAllDiscoveriesMutationVariables>;
export const GetSiloConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiloConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"siloSpecification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"siloConfig"}}]}}]}}]} as unknown as DocumentNode<GetSiloConfigQuery, GetSiloConfigQueryVariables>;
export const UpdateSiloDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSilo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSiloDefinitionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSiloDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateSiloMutation, UpdateSiloMutationVariables>;
export const DiscoverJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DiscoverJobs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"jobType"},"value":{"kind":"StringValue","value":"discover_sources","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"numJobs"}}]}}]}}]}}]} as unknown as DocumentNode<DiscoverJobsQuery, DiscoverJobsQueryVariables>;