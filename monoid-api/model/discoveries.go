package model

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/datatypes"
)

type DataDiscoveryData interface {
	IsDataDiscoveryData()
	Mappable() interface{}
}

type DataDiscovery struct {
	Data   datatypes.JSON
	ID     string
	Type   DiscoveryType
	Status DiscoveryStatus

	SiloDefinition   SiloDefinition
	SiloDefinitionID string

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (dd *DataDiscovery) DeserializeData() (DataDiscoveryData, error) {
	switch dd.Type {
	case DiscoveryTypeCategoryFound:
		res := NewCategoryDiscovery{}
		if err := json.Unmarshal(dd.Data, &res); err != nil {
			return nil, err
		}
		res.DataDiscoveryID = dd.ID

		return res, nil
	case DiscoveryTypePropertyFound:
		res := NewPropertyDiscovery{}
		if err := json.Unmarshal(dd.Data, &res); err != nil {
			return nil, err
		}
		res.DataDiscoveryID = dd.ID

		return res, nil
	case DiscoveryTypeDataSourceFound:
		res := NewDataSourceDiscovery{}
		if err := json.Unmarshal(dd.Data, &res); err != nil {
			return nil, err
		}
		res.DataDiscoveryID = dd.ID

		return res, nil
	case DiscoveryTypePropertyMissing:
		fallthrough
	case DiscoveryTypeDataSourceMissing:
		res := ObjectMissingDiscovery{}
		if err := json.Unmarshal(dd.Data, &res); err != nil {
			return nil, err
		}
		return res, nil
	}

	return nil, fmt.Errorf("unknown data type: %v", dd.Type)
}

type NewDataSourceDiscovery struct {
	DataDiscoveryID string                 `json:"-"`
	Name            string                 `json:"name"`
	Group           *string                `json:"group"`
	Properties      []NewPropertyDiscovery `json:"properties"`
}

func (NewDataSourceDiscovery) IsDataDiscoveryData() {}

type dataSourceDiscoveryKey struct {
	Name  string
	Group string
}

func (d NewDataSourceDiscovery) Mappable() interface{} {
	group := ""
	if d.Group != nil {
		group = *d.Group
	}

	return dataSourceDiscoveryKey{
		Name:  d.Name,
		Group: group,
	}
}

type NewPropertyDiscovery struct {
	DataDiscoveryID string                 `json:"-"`
	Name            string                 `json:"name"`
	DataSourceId    *string                `json:"dataSourceId"`
	Categories      []NewCategoryDiscovery `json:"categories"`
}

func (NewPropertyDiscovery) IsDataDiscoveryData() {}

type propertyDiscoveryKey struct {
	Name         string
	DataSourceID string
}

func (d NewPropertyDiscovery) Mappable() interface{} {
	dsid := ""
	if d.DataSourceId != nil {
		dsid = *d.DataSourceId
	}

	return propertyDiscoveryKey{
		Name:         d.Name,
		DataSourceID: dsid,
	}
}

type NewCategoryDiscovery struct {
	DataDiscoveryID string  `json:"-"`
	PropertyID      *string `json:"propertyId"`
	CategoryID      string  `json:"categoryId"`
}

func (NewCategoryDiscovery) IsDataDiscoveryData() {}

type categoryDiscoveryKey struct {
	CategoryID string
	PropertyID string
}

func (d NewCategoryDiscovery) Mappable() interface{} {
	pid := ""
	if d.PropertyID != nil {
		pid = *d.PropertyID
	}

	return categoryDiscoveryKey{
		CategoryID: d.CategoryID,
		PropertyID: pid,
	}
}

type ObjectMissingDiscovery struct {
	ID string `json:"id"`
}

func (ObjectMissingDiscovery) IsDataDiscoveryData() {}
func (d ObjectMissingDiscovery) Mappable() interface{} {
	return d
}
