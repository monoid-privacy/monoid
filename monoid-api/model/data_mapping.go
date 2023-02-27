package model

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// SiloSpecification is the information about all silos that have
// integrations with monoid
type SiloSpecification struct {
	ID              string
	Name            string
	LogoURL         *string
	WorkspaceID     *string
	Workspace       *Workspace `gorm:"constraint:OnDelete:CASCADE;"`
	Manual          bool       `gorm:"default:false"`
	DockerImage     string
	DockerTag       string
	Schema          *string
	SiloDefinitions []SiloDefinition
}

func (ss *SiloSpecification) KeyField(field string) (string, error) {
	if field == "id" {
		return ss.ID, nil
	}

	return "", fmt.Errorf("unknown field")
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
	DataSources         []*DataSource
	Config              SecretString
	DataDiscoveries     []DataDiscovery

	CreatedAt time.Time
	UpdatedAt time.Time
}

type DataSource struct {
	ID    string
	Group *string
	Name  string

	SiloDefinitionID string
	SiloDefinition   SiloDefinition `gorm:"constraint:OnDelete:CASCADE;"`
	Properties       []*Property
	Description      *string
	RequestStatuses  []RequestStatus

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt
}

func DeleteProperty(propID string, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		prop := Property{}
		if err := tx.Where(
			"id = ?",
			propID,
		).Preload("DataSource").First(&prop).Error; err != nil {
			return err
		}

		if err := deleteProperties(
			prop.DataSource.SiloDefinitionID,
			[]string{propID},
			db,
		); err != nil {
			return err
		}

		return nil
	})
}

func deleteProperties(siloID string, propIDs []string, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&DataDiscovery{}).Where(
			"silo_definition_id = ?",
			siloID,
		).Where(
			"data->>'propertyId' IN (?)",
			propIDs,
		).Delete(nil).Error; err != nil {
			return err
		}

		// Soft delete any properties that are associated with this data source
		if err := tx.Model(&Property{}).Where(
			"id IN (?)",
			propIDs,
		).Delete(nil).Error; err != nil {
			return err
		}

		return nil
	})
}

func DeleteDataSource(dsid string, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		dataSource := &DataSource{}

		if err := tx.Where(
			"id = ?",
			dsid,
		).Preload("Properties").First(dataSource).Error; err != nil {
			return err
		}

		propertyIDs := make([]string, len(dataSource.Properties))

		for i, p := range dataSource.Properties {
			propertyIDs[i] = p.ID
		}

		// Soft delete the data source
		if err := tx.Delete(dataSource).Error; err != nil {
			return err
		}

		// Hard delete any discoveries that reference this data source
		if err := tx.Model(&DataDiscovery{}).Where(
			"silo_definition_id = ?",
			dataSource.SiloDefinitionID,
		).Where(
			"data->>'dataSourceId' = ?",
			dataSource.ID,
		).Delete(nil).Error; err != nil {
			return err
		}

		if err := deleteProperties(dataSource.SiloDefinitionID, propertyIDs, tx); err != nil {
			return err
		}

		return nil
	})
}

func (ds *DataSource) KeyField(field string) (string, error) {
	if field == "id" {
		return ds.ID, nil
	}

	return "", fmt.Errorf("unknown field")
}

type Property struct {
	ID               string      `json:"id"`
	Name             string      `json:"name"`
	Categories       []*Category `gorm:"many2many:property_categories;"`
	DataSourceID     string      `json:"dataSourceID"`
	DataSource       DataSource  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Purposes         []*Purpose  `gorm:"many2many:property_purposes;"`
	UserPrimaryKeyID *string
	UserPrimaryKey   *UserPrimaryKey `gorm:"constraint:OnUpdate:CASCADE;"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt
}

type Category struct {
	ID          string
	Name        string
	WorkspaceID *string
	Workspace   Workspace `gorm:"constraint:OnDelete:CASCADE;"`
}

type Purpose struct {
	ID          string
	Name        string
	WorkspaceID string
	Workspace   Workspace `gorm:"constraint:OnDelete:CASCADE;"`
}

type DataMapRow struct {
	SiloDefinitionID string
	SiloDefinition   SiloDefinition

	PropertyID string
	Property   Property

	DataSourceID string
	DataSource   DataSource
}
