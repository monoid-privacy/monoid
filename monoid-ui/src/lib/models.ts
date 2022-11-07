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
  name?: string
}

export interface DataSource {
  id?: string
  name?: string
  properties?: Property[]
}
