package resolver

import (
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
)

func propertiesForDiscoveries(discoveries []model.NewPropertyDiscovery) []*model.Property {
	properties := []*model.Property{}

	for _, d := range discoveries {
		properties = append(properties, &model.Property{
			Name: d.Name,
			ID:   uuid.NewString(),
		})
	}

	return properties
}
