package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
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

// HandleDiscovery is the resolver for the handleDiscovery field.
func (r *mutationResolver) HandleDiscovery(ctx context.Context, input *model.HandleDiscoveryInput) (*model.DataDiscovery, error) {
	discovery := model.DataDiscovery{}
	if err := r.Conf.DB.Where("id = ?", input.DiscoveryID).First(&discovery).Error; err != nil {
		return nil, handleError(err, "Could not find discovery.")
	}

	analyticsData := map[string]interface{}{
		"action": input.Action.String(),
		"siloId": discovery.SiloDefinitionID,
	}

	r.Conf.AnalyticsIngestor.Track("discoveryAction", nil, analyticsData)

	if input.Action == model.DiscoveryActionReject {
		if err := r.Conf.DB.Model(&discovery).Update("status", model.DiscoveryStatusRejected).Error; err != nil {
			return nil, handleError(err, "Error updating discovery.")
		}
		return &discovery, nil
	}

	switch discovery.Type {
	case model.DiscoveryTypeCategoryFound:
		data := model.NewCategoryDiscovery{}
		if err := json.Unmarshal(discovery.Data, &data); err != nil || data.PropertyID == nil {
			return nil, handleError(err, "Error getting data")
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			if err := r.Conf.DB.Model(&model.Property{ID: *data.PropertyID}).Association("Categories").Append(
				&model.Category{
					ID: data.CategoryID,
				},
			); err != nil {
				return err
			}

			if err := tx.Model(&discovery).Update(
				"status", model.DiscoveryStatusAccepted,
			).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Could not update category.")
		}
	case model.DiscoveryTypeDataSourceFound:
		data := model.NewDataSourceDiscovery{}
		if err := json.Unmarshal(discovery.Data, &data); err != nil {
			return nil, handleError(err, "Error getting data")
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			dataSource := model.DataSource{
				ID:               uuid.NewString(),
				Group:            data.Group,
				Name:             data.Name,
				SiloDefinitionID: discovery.SiloDefinitionID,
				Properties:       propertiesForDiscoveries(data.Properties),
			}

			if err := tx.Create(&dataSource).Error; err != nil {
				return err
			}

			if err := tx.Model(&discovery).Update(
				"status", model.DiscoveryStatusAccepted,
			).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Could not update data source.")
		}
	case model.DiscoveryTypePropertyFound:
		data := model.NewPropertyDiscovery{}
		if err := json.Unmarshal(discovery.Data, &data); err != nil || data.DataSourceId == nil {
			return nil, handleError(err, "Error getting data")
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			prop := propertiesForDiscoveries([]model.NewPropertyDiscovery{data})[0]
			prop.DataSourceID = *data.DataSourceId

			if err := tx.Create(&prop).Error; err != nil {
				return err
			}

			if err := tx.Model(&discovery).Update(
				"status", model.DiscoveryStatusAccepted,
			).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Could not update property.")
		}
	case model.DiscoveryTypeDataSourceMissing:
		data := model.ObjectMissingDiscovery{}
		if err := json.Unmarshal(discovery.Data, &data); err != nil {
			return nil, handleError(err, "Error getting data")
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			ds := model.DataSource{}
			if err := tx.Model(&model.DataSource{}).Preload("Properties").Where(
				"id = ?",
				data.ID,
			).First(&ds).Error; err != nil {
				return err
			}

			if err := tx.Model(&ds.Properties).Association("Categories").Clear(); err != nil {
				return err
			}

			if err := tx.Model(&model.Property{}).Where(
				"data_source_id = ?", data.ID,
			).Delete(nil).Error; err != nil {
				return err
			}

			if err := tx.Model(&model.DataSource{}).Where(
				"id = ?",
				data.ID,
			).Delete(nil).Error; err != nil {
				return err
			}

			if err := tx.Model(&discovery).Update(
				"status", model.DiscoveryStatusAccepted,
			).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Error deleting data source")
		}
	case model.DiscoveryTypePropertyMissing:
		data := model.ObjectMissingDiscovery{}
		if err := json.Unmarshal(discovery.Data, &data); err != nil {
			return nil, handleError(err, "Error getting data")
		}

		if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Select("Categories").Delete(&model.Property{ID: data.ID}).Error; err != nil {
				return err
			}

			if err := tx.Model(&discovery).Update(
				"status", model.DiscoveryStatusAccepted,
			).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			return nil, handleError(err, "Error deleting data source")
		}
	}

	return &discovery, nil
}

// Discoveries is the resolver for the discoveries field.
func (r *siloDefinitionResolver) Discoveries(ctx context.Context, obj *model.SiloDefinition) ([]*model.DataDiscovery, error) {
	discoveries := []*model.DataDiscovery{}
	if err := r.Conf.DB.Where(
		"silo_definition_id = ?",
		obj.ID,
	).Order(
		"(CASE WHEN status = 'OPEN' THEN 1 ELSE 2 END) asc, created_at desc, id desc",
	).Find(&discoveries).Error; err != nil {
		return nil, handleError(err, "Error getting discoveries")
	}

	return discoveries, nil
}

// DataDiscovery returns generated.DataDiscoveryResolver implementation.
func (r *Resolver) DataDiscovery() generated.DataDiscoveryResolver { return &dataDiscoveryResolver{r} }

type dataDiscoveryResolver struct{ *Resolver }
