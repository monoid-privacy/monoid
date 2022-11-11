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
}

export interface DataSource {
  id?: string
  name?: string
  properties?: Property[]
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
