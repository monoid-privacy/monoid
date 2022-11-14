export interface SiloSpec {
  id: string
  logoUrl?: string
  name: string
  schema: string
}

export interface SiloDefinition {
  id?: string,
  name?: string,
  siloSpecification?: SiloSpec,
  siloConfig?: object
}

type TentativeValue = 'CREATED' | 'DELETED' | null;

export interface Property {
  id?: string
  name?: string
  tentative?: TentativeValue
  categories?: Category[]
  dataSource?: DataSource
}

export interface DataSource {
  id?: string
  name?: string
  group?: string
  properties?: Property[]
  tentative?: TentativeValue
}

export interface Category {
  id?: string
  name?: string
  tentative?: TentativeValue
}

export interface Job {
  id?: string,
  jobType?: string,
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
  categories?: NewCategoryDiscoveryData[]
}

export interface NewCategoryDiscoveryData {
  propertyId?: string
  categoryId: string
}

export interface ObjectMissingDiscoveryData {
  id?: string
}

type CoreDataDiscovery = {
  id?: string
  createdAt?: string
  status?: 'OPEN' | 'ACCEPTED' | 'REJECTED'
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
  data?: ObjectMissingDiscoveryData,
  type?: 'DATA_SOURCE_MISSING'
};

type MissingPropertyDiscovery = CoreDataDiscovery & {
  data?: ObjectMissingDiscoveryData,
  type?: 'PROPERTY_MISSING'
};

type MissingCategoryDiscovery = CoreDataDiscovery & {
  data?: ObjectMissingDiscoveryData,
  type?: 'CATEGORY_MISSING'
};

export type DataDiscovery = (
  NewDataSourceDiscovery |
  NewPropertyDiscovery |
  NewCategoryDiscovery |
  MissingDataSourceDiscovery |
  MissingPropertyDiscovery |
  MissingCategoryDiscovery
);
