export interface SiloSpec {
  id: string
  logoUrl?: string
  logo?: string
  name: string
  schema: string
}

export interface SiloDefinition {
  id?: string,
  name?: string,
  siloSpecification?: SiloSpec,
  siloConfig?: object
}

export interface Workspace {
  id?: string,
  requests?: Request[]
  userPrimaryKeys?: UserPrimaryKey[]
}

type TentativeValue = 'CREATED' | 'DELETED' | null;

export interface Request {
  id?: string
  createdAt?: string
  primaryKeyValues?: PrimaryKeyValue[]
  requestStatuses?: {
    numStatuses?: number,
    requestStatusRows?: RequestStatus[]
  }
  type?: string
}

export interface QueryResult {
  id?: string
  requestStatus?: RequestStatus
  records?: string
}

export interface RequestStatus {
  id?: string
  request?: Request
  dataSource?: DataSource
  status?: string
  queryResult?: QueryResult | null
}

export interface PrimaryKeyValue {
  id?: string
  userPrimaryKey?: UserPrimaryKey
  request?: Request
  value?: string
}

export interface UserDataRequestInput {
  primaryKeys?: UserPrimaryKeyInput[]
  workspaceId?: string
  type?: string
}

export interface UserPrimaryKeyInput {
  apiIdentifier?: string
  value?: string
}

export interface UserPrimaryKey {
  id?: string
  name?: string
  apiIdentifier?: string
  properties?: Property[]
}

export interface Property {
  id?: string
  name?: string
  tentative?: TentativeValue
  userPrimaryKey?: UserPrimaryKey | null
  categories?: Category[]
  dataSource?: DataSource
}

export interface DataSource {
  id?: string
  name?: string
  group?: string
  properties?: Property[]
  tentative?: TentativeValue
  siloDefinition?: SiloDefinition
}

export interface Category {
  id?: string
  name?: string
  tentative?: TentativeValue
}

export interface Job {
  id?: string,
  jobType?: string,
  siloDefinition?: SiloDefinition
  status?: 'RUNNING' | 'QUEUED' | 'FAILED' | 'COMPLETED'
  createdAt?: string
}

// Discovery models
export interface NewDataSourceDiscoveryData {
  name: string
  group?: string
  properties?: NewPropertyDiscoveryData[]
}

export interface NewPropertyDiscoveryData {
  name: string
  dataSourceId?: string
  dataSource?: DataSource | null
  categories?: NewCategoryDiscoveryData[]
}

export interface NewCategoryDiscoveryData {
  propertyId?: string
  categoryId: string
  category: Category
  property?: Property | null
}

export interface PropertyMissingDiscoveryData {
  id?: string
  property?: Property | null
}

export interface DataSourceMissingDiscoveryData {
  id?: string
  dataSource?: DataSource | null
}

type CoreDataDiscovery = {
  id?: string
  createdAt?: string
  status?: 'OPEN' | 'ACCEPTED' | 'REJECTED'
  siloDefinition?: SiloDefinition
};

type NewDataSourceDiscovery = CoreDataDiscovery & {
  type?: 'DATA_SOURCE_FOUND'
  data?: NewDataSourceDiscoveryData
};

type NewPropertyDiscovery = CoreDataDiscovery & {
  type?: 'PROPERTY_FOUND'
  data?: NewPropertyDiscoveryData
};

type NewCategoryDiscovery = CoreDataDiscovery & {
  type?: 'CATEGORY_FOUND'
  data?: NewCategoryDiscoveryData
};

type MissingDataSourceDiscovery = CoreDataDiscovery & {
  data?: DataSourceMissingDiscoveryData,
  type?: 'DATA_SOURCE_MISSING'
};

type MissingPropertyDiscovery = CoreDataDiscovery & {
  data?: PropertyMissingDiscoveryData,
  type?: 'PROPERTY_MISSING'
};

export type DataDiscovery = (
  NewDataSourceDiscovery |
  NewPropertyDiscovery |
  NewCategoryDiscovery |
  MissingDataSourceDiscovery |
  MissingPropertyDiscovery
);
