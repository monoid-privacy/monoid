package model

type SiloSpecification struct {
	ID          string
	Name        string
	LogoURL     *string
	WorkspaceID string
	DockerImage *string
	Schema      *string
}

type SiloDefinition struct {
	ID                  string
	WorkspaceID         string
	Description         *string
	SiloSpecificationID string
	SiloSpecification   SiloSpecification
	DataSources         []DataSource
	Subjects            []Subject `gorm:"many2many:silo_definition_subjects;"`
}

type DataSource struct {
	ID               string
	SiloDefinitionID string
	SiloDefinition   SiloDefinition
	Properties       []*Property
	Description      *string
}

type Subject struct {
	ID   string
	Name string
}

type Category struct {
	ID   string
	Name string
}

type Purpose struct {
	ID   string
	Name string
}
