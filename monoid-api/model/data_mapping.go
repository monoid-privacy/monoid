package model

type Connector struct {
	ID string
}

type SiloSpecification struct {
	ID          string
	ConnectorID string
	Connector   Connector
	Name        string
	LogoURL     *string
	WorkspaceID string
}

type SiloDefinition struct {
	ID                  string
	WorkspaceID         string
	Description         *string
	SiloSpecificationID string
	SiloSpecification   SiloSpecification
	Subjects            []Subject `gorm:"many2many:silo_definition_subjects;"`
}

type Datapoint struct {
	ID               string
	SiloDefinitionID string
	SiloDefinition   SiloDefinition
	Categories       []Category `gorm:"many2many:datapoint_categories;"`
	Purposes         []Purpose  `gorm:"many2many:datapoint_purposes;"`
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
