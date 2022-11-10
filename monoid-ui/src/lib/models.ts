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

export interface Property {
  id?: string
  name?: string
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
}

export interface Job {
  id?: string,
  jobType?: string,
  status?: 'RUNNING' | 'QUEUED' | 'FAILED' | 'SUCCESS'
}
