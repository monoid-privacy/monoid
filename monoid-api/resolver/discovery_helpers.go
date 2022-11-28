package resolver

import (
	"encoding/json"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
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

func applyDiscoveries(
	conf *config.BaseConfig,
	discoveries []*model.DataDiscovery,
	action model.DiscoveryAction,
) ([]*model.DataDiscovery, []error) {
	res := make([]*model.DataDiscovery, 0, len(discoveries))
	errors := make([]error, 0, len(discoveries))

	for _, discovery := range discoveries {
		analyticsData := map[string]interface{}{
			"action": action.String(),
			"siloId": discovery.SiloDefinitionID,
		}

		conf.AnalyticsIngestor.Track("discoveryAction", nil, analyticsData)

		if action == model.DiscoveryActionReject {
			if err := conf.DB.Model(&discovery).Update("status", model.DiscoveryStatusRejected).Error; err != nil {
				errors = append(errors, err)
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				continue
			}

			res = append(res, discovery)
			continue
		}

		switch discovery.Type {
		case model.DiscoveryTypeCategoryFound:
			data := model.NewCategoryDiscovery{}
			if err := json.Unmarshal(discovery.Data, &data); err != nil || data.PropertyID == nil {
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}

			if err := conf.DB.Transaction(func(tx *gorm.DB) error {
				if err := conf.DB.Model(&model.Property{ID: *data.PropertyID}).Association("Categories").Append(
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
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}
		case model.DiscoveryTypeDataSourceFound:
			data := model.NewDataSourceDiscovery{}
			if err := json.Unmarshal(discovery.Data, &data); err != nil {
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}

			if err := conf.DB.Transaction(func(tx *gorm.DB) error {
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
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}
		case model.DiscoveryTypePropertyFound:
			data := model.NewPropertyDiscovery{}
			if err := json.Unmarshal(discovery.Data, &data); err != nil || data.DataSourceId == nil {
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}

			if err := conf.DB.Transaction(func(tx *gorm.DB) error {
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
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}
		case model.DiscoveryTypeDataSourceMissing:
			data := model.DataSourceMissingDiscovery{}
			if err := json.Unmarshal(discovery.Data, &data); err != nil {
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}

			if err := conf.DB.Transaction(func(tx *gorm.DB) error {
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
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}
		case model.DiscoveryTypePropertyMissing:
			data := model.PropertyMissingDiscovery{}
			if err := json.Unmarshal(discovery.Data, &data); err != nil {
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}

			if err := conf.DB.Transaction(func(tx *gorm.DB) error {
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
				log.Err(err).Msgf("Error updating %s", discovery.ID)
				errors = append(errors, err)
				continue
			}
		}

		res = append(res, discovery)
	}

	return res, errors
}
