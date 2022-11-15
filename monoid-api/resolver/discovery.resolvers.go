package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"gorm.io/gorm"
)

// Data is the resolver for the data field.
func (r *dataDiscoveryResolver) Data(ctx context.Context, obj *model.DataDiscovery) (model.DataDiscoveryData, error) {
	data, err := obj.DeserializeData()
	if err != nil {
		return nil, handleError(err, "Error processing data.")
	}

	return data, nil
}

// DataSource is the resolver for the dataSource field.
func (r *dataSourceMissingDiscoveryResolver) DataSource(ctx context.Context, obj *model.DataSourceMissingDiscovery) (*model.DataSource, error) {
	dataSource := model.DataSource{}
	if err := r.Conf.DB.Where("id = ?", obj.ID).First(&dataSource).Error; err != nil {
		if errors.Is(gorm.ErrRecordNotFound, err) {
			return nil, nil
		}

		return nil, handleError(err, "Error finding data source")
	}

	return &dataSource, nil
}

// HandleDiscovery is the resolver for the handleDiscovery field.
func (r *mutationResolver) HandleDiscovery(ctx context.Context, input *model.HandleDiscoveryInput) (*model.DataDiscovery, error) {
	discovery := model.DataDiscovery{}
	if err := r.Conf.DB.Where("id = ?", input.DiscoveryID).First(&discovery).Error; err != nil {
		return nil, handleError(err, "Could not find discovery.")
	}

	res, errs := applyDiscoveries(r.Conf, []*model.DataDiscovery{&discovery}, input.Action)
	if len(errs) != 0 {
		return nil, handleError(errs[0], "Error applying discovery.")
	}

	return res[0], nil
}

// HandleAllOpenDiscoveries is the resolver for the handleAllOpenDiscoveries field.
func (r *mutationResolver) HandleAllOpenDiscoveries(ctx context.Context, input *model.HandleAllDiscoveriesInput) ([]*model.DataDiscovery, error) {
	discoveries := []*model.DataDiscovery{}
	if err := r.Conf.DB.Where(
		"status = ?",
		model.DiscoveryStatusOpen,
	).Where(
		"silo_definition_id = ?",
		input.SiloID,
	).Find(&discoveries).Error; err != nil {
		return nil, handleError(err, "Error finding discoveries.")
	}

	res, errs := applyDiscoveries(r.Conf, discoveries, input.Action)
	if len(errs) != 0 {
		return nil, handleError(errs[0], fmt.Sprintf("Errors applying %d discoveries.", len(errs)))
	}

	return res, nil
}

// Category is the resolver for the category field.
func (r *newCategoryDiscoveryResolver) Category(ctx context.Context, obj *model.NewCategoryDiscovery) (*model.Category, error) {
	category := model.Category{}
	if err := r.Conf.DB.Where("id = ?", obj.CategoryID).First(&category).Error; err != nil {
		return nil, handleError(err, "Error finding category")
	}

	return &category, nil
}

// Property is the resolver for the property field.
func (r *newCategoryDiscoveryResolver) Property(ctx context.Context, obj *model.NewCategoryDiscovery) (*model.Property, error) {
	if obj.PropertyID == nil {
		return nil, nil
	}

	property := model.Property{}
	if err := r.Conf.DB.Where("id = ?", obj.PropertyID).First(&property).Error; err != nil {
		if errors.Is(gorm.ErrRecordNotFound, err) {
			return nil, nil
		}

		return nil, handleError(err, "Error finding property")
	}

	return &property, nil
}

// DataSource is the resolver for the dataSource field.
func (r *newPropertyDiscoveryResolver) DataSource(ctx context.Context, obj *model.NewPropertyDiscovery) (*model.DataSource, error) {
	if obj.DataSourceId == nil {
		return nil, nil
	}

	dataSource := model.DataSource{}
	if err := r.Conf.DB.Where("id = ?", obj.DataSourceId).First(&dataSource).Error; err != nil {
		if errors.Is(gorm.ErrRecordNotFound, err) {
			return nil, nil
		}

		return nil, handleError(err, "Error finding data source")
	}

	return &dataSource, nil
}

// Property is the resolver for the property field.
func (r *propertyMissingDiscoveryResolver) Property(ctx context.Context, obj *model.PropertyMissingDiscovery) (*model.Property, error) {
	property := model.Property{}
	if err := r.Conf.DB.Where("id = ?", obj.ID).First(&property).Error; err != nil {
		if errors.Is(gorm.ErrRecordNotFound, err) {
			return nil, nil
		}

		return nil, handleError(err, "Error finding data source")
	}

	return &property, nil
}

// Discoveries is the resolver for the discoveries field.
func (r *siloDefinitionResolver) Discoveries(ctx context.Context, obj *model.SiloDefinition, statuses []*model.DiscoveryStatus, limit int, offset int) (*model.DataDiscoveriesListResult, error) {
	discoveries := []*model.DataDiscovery{}
	q := r.Conf.DB.Where(
		"silo_definition_id = ?",
		obj.ID,
	)

	if len(statuses) != 0 {
		q = q.Where("status IN ?", statuses)
	}

	q = q.Order(
		"(CASE WHEN status = 'OPEN' THEN 1 ELSE 2 END) asc, created_at desc, id desc",
	)

	if err := q.Session(&gorm.Session{}).Limit(limit).Offset(offset).Find(&discoveries).Error; err != nil {
		return nil, handleError(err, "Error getting discoveries")
	}

	count := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.DataDiscovery{}).Count(&count).Error; err != nil {
		return nil, handleError(err, "Error getting discovery count.")
	}

	return &model.DataDiscoveriesListResult{
		Discoveries:    discoveries,
		NumDiscoveries: int(count),
	}, nil
}

// DataDiscovery returns generated.DataDiscoveryResolver implementation.
func (r *Resolver) DataDiscovery() generated.DataDiscoveryResolver { return &dataDiscoveryResolver{r} }

// DataSourceMissingDiscovery returns generated.DataSourceMissingDiscoveryResolver implementation.
func (r *Resolver) DataSourceMissingDiscovery() generated.DataSourceMissingDiscoveryResolver {
	return &dataSourceMissingDiscoveryResolver{r}
}

// NewCategoryDiscovery returns generated.NewCategoryDiscoveryResolver implementation.
func (r *Resolver) NewCategoryDiscovery() generated.NewCategoryDiscoveryResolver {
	return &newCategoryDiscoveryResolver{r}
}

// NewPropertyDiscovery returns generated.NewPropertyDiscoveryResolver implementation.
func (r *Resolver) NewPropertyDiscovery() generated.NewPropertyDiscoveryResolver {
	return &newPropertyDiscoveryResolver{r}
}

// PropertyMissingDiscovery returns generated.PropertyMissingDiscoveryResolver implementation.
func (r *Resolver) PropertyMissingDiscovery() generated.PropertyMissingDiscoveryResolver {
	return &propertyMissingDiscoveryResolver{r}
}

type dataDiscoveryResolver struct{ *Resolver }
type dataSourceMissingDiscoveryResolver struct{ *Resolver }
type newCategoryDiscoveryResolver struct{ *Resolver }
type newPropertyDiscoveryResolver struct{ *Resolver }
type propertyMissingDiscoveryResolver struct{ *Resolver }
