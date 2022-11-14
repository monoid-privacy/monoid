package resolver

import (
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
)

func categoriesForDiscoveries(discoveries []model.NewCategoryDiscovery) []*model.Category {
	categories := []*model.Category{}

	for _, d := range discoveries {
		categories = append(categories, &model.Category{
			ID: d.CategoryID,
		})
	}

	return categories
}

func propertiesForDiscoveries(discoveries []model.NewPropertyDiscovery) []*model.Property {
	properties := []*model.Property{}

	for _, d := range discoveries {
		properties = append(properties, &model.Property{
			Name:       d.Name,
			ID:         uuid.NewString(),
			Categories: categoriesForDiscoveries(d.Categories),
		})
	}

	return properties
}
