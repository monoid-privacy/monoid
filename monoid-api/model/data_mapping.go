package model

// SiloSpecification is the information about all silos that have
// integrations with monoid
type SiloSpecification struct {
	ID              string
	Name            string
	LogoURL         *string
	WorkspaceID     *string
	Workspace       *Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	DockerImage     string
	DockerTag       string
	Schema          *string
	SiloDefinitions []SiloDefinition
}

// SiloDefinition is an instantiation of a silo
type SiloDefinition struct {
	ID                  string
	Name                string
	WorkspaceID         string
	Workspace           Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	Description         *string
	SiloSpecificationID string
	SiloSpecification   SiloSpecification `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	DataSources         []DataSource
	Subjects            []Subject `gorm:"many2many:silo_definition_subjects;"`
	Config              SecretString
}

type DataSource struct {
	ID               string
	SiloDefinitionID string
	SiloDefinition   SiloDefinition `gorm:"constraint:OnDelete:CASCADE;"`
	Properties       []*Property
	Description      *string
	Schema           string
}

type Property struct {
	ID           string      `json:"id"`
	Categories   []*Category `gorm:"many2many:property_categories;"`
	DataSourceID string      `json:"dataSourceID"`
	DataSource   DataSource  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Purposes     []*Purpose  `gorm:"many2many:property_purposes;"`
}

type Subject struct {
	ID          string
	Name        string
	WorkspaceID string
	Workspace   Workspace `gorm:"constraint:OnDelete:CASCADE;"`
}

type Category struct {
	ID          string
	Name        string
	WorkspaceID string
	Workspace   Workspace `gorm:"constraint:OnDelete:CASCADE;"`
}

type Purpose struct {
	ID          string
	Name        string
	WorkspaceID string
	Workspace   Workspace `gorm:"constraint:OnDelete:CASCADE;"`
}
