package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/dataloader"
	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/workflow"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
)

// SiloDefinition is the resolver for the siloDefinition field.
func (r *dataSourceResolver) SiloDefinition(ctx context.Context, obj *model.DataSource) (*model.SiloDefinition, error) {
	return dataloader.SiloDefinition(ctx, obj.SiloDefinitionID)
}

// Properties is the resolver for the properties field.
func (r *dataSourceResolver) Properties(ctx context.Context, obj *model.DataSource) ([]*model.Property, error) {
	return dataloader.DataSourceProperties(ctx, obj.ID)
}

// Deleted is the resolver for the deleted field.
func (r *dataSourceResolver) Deleted(ctx context.Context, obj *model.DataSource) (bool, error) {
	return obj.DeletedAt.Valid, nil
}

// CreateDataSource is the resolver for the createDataSource field.
func (r *mutationResolver) CreateDataSource(ctx context.Context, input model.CreateDataSourceInput) (*model.DataSource, error) {
	dataSource := model.DataSource{
		ID:               uuid.NewString(),
		SiloDefinitionID: input.SiloDefinitionID,
		Name:             input.Name,
		Group:            input.Group,
	}

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&dataSource).Error; err != nil {
			return err
		}

		properties := []model.Property{}

		for _, pr := range input.Properties {
			fmt.Println("Cat", pr.CategoryIDs)

			cats := make([]*model.Category, len(pr.CategoryIDs))
			for i, c := range pr.CategoryIDs {
				cats[i] = &model.Category{ID: c}
			}

			properties = append(properties, model.Property{
				ID:           uuid.NewString(),
				Name:         pr.Name,
				Categories:   cats,
				DataSourceID: dataSource.ID,
			})
		}

		if err := tx.Create(properties).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, handleError(err, "Error creating data source.")
	}

	return &dataSource, nil
}

// CreateSiloSpecification is the resolver for the createSiloSpecification field.
func (r *mutationResolver) CreateSiloSpecification(ctx context.Context, input *model.CreateSiloSpecificationInput) (*model.SiloSpecification, error) {
	siloSpecification := model.SiloSpecification{
		ID:          uuid.NewString(),
		Name:        input.Name,
		LogoURL:     input.LogoURL,
		WorkspaceID: &input.WorkspaceID,
		DockerImage: input.DockerImage,
		Schema:      input.Schema,
	}

	if err := r.Conf.DB.Create(&siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error creating silo specification.")
	}

	return &siloSpecification, nil
}

// CreateProperty is the resolver for the createProperty field.
func (r *mutationResolver) CreateProperty(ctx context.Context, input *model.CreatePropertyInput) (*model.Property, error) {
	property := model.Property{
		ID:           uuid.NewString(),
		DataSourceID: input.DataSourceID,
		Name:         input.Property.Name,
	}

	if err := r.Conf.DB.Create(&property).Error; err != nil {
		return nil, handleError(err, "Error creating property.")
	}

	categories := []model.Category{}

	if err := r.Conf.DB.Where("id IN ?", input.Property.CategoryIDs).Find(&categories).Error; err != nil {
		return nil, handleError(err, "Error finding categories.")
	}

	if err := r.Conf.DB.Model(&property).Association("Categories").Append(categories); err != nil {
		return nil, handleError(err, "Error creating categories.")
	}

	return &property, nil
}

// UpdateDataSource is the resolver for the updateDataSource field.
func (r *mutationResolver) UpdateDataSource(ctx context.Context, input *model.UpdateDataSourceInput) (*model.DataSource, error) {
	dataSource := model.DataSource{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&dataSource).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	dataSource.Description = input.Description

	if err := r.Conf.DB.Save(&dataSource).Error; err != nil {
		return nil, handleError(err, "Error updating data source.")
	}

	return &dataSource, nil
}

// UpdateSiloSpecification is the resolver for the updateSiloSpecification field.
func (r *mutationResolver) UpdateSiloSpecification(ctx context.Context, input *model.UpdateSiloSpecificationInput) (*model.SiloSpecification, error) {
	siloSpecification := model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error finding silo specification.")
	}

	if input.DockerImage != nil {
		siloSpecification.DockerImage = *input.DockerImage
	}

	if input.Name != nil {
		siloSpecification.Name = *input.Name
	}

	siloSpecification.LogoURL = input.LogoURL

	siloSpecification.Schema = input.Schema

	if err := r.Conf.DB.Save(&siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error updating silo specification.")
	}

	return &siloSpecification, nil
}

// UpdateProperty is the resolver for the updateProperty field.
func (r *mutationResolver) UpdateProperty(ctx context.Context, input *model.UpdatePropertyInput) (*model.Property, error) {
	property := model.Property{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&property).Error; err != nil {
		return nil, handleError(err, "Error finding property.")
	}

	// Updating categories
	if input.CategoryIDs != nil {
		categories := []model.Category{}

		if err := r.Conf.DB.Where("id IN ?", input.CategoryIDs).Find(&categories).Error; err != nil {
			return nil, handleError(err, "Error updating property.")
		}

		if err := r.Conf.DB.Model(&property).Association("Categories").Replace(&categories); err != nil {
			return nil, handleError(err, "Error updating property.")
		}
	}

	if err := r.Conf.DB.Omit("Categories", "Purposes").Save(&property).Error; err != nil {
		return nil, handleError(err, "Error updating property.")
	}

	return &property, nil
}

// DeleteDataSource is the resolver for the deleteDataSource field.
func (r *mutationResolver) DeleteDataSource(ctx context.Context, id string) (*string, error) {
	if err := model.DeleteDataSource(id, r.Conf.DB); err != nil {
		return nil, handleError(err, "Error deleting data source.")
	}

	return &id, nil
}

// DeleteSiloSpecification is the resolver for the deleteSiloSpecification field.
func (r *mutationResolver) DeleteSiloSpecification(ctx context.Context, id string) (*string, error) {
	siloSpecification := &model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", id).First(siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error finding silo specification.")
	}

	if err := r.Conf.DB.Delete(siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error deleting silo specification.")
	}

	// TODO: Ensure that delete cascades to SET NULL for silo definition

	return &id, nil
}

// DeleteProperty is the resolver for the deleteProperty field.
func (r *mutationResolver) DeleteProperty(ctx context.Context, id string) (*string, error) {
	if err := model.DeleteProperty(id, r.Conf.DB); err != nil {
		return nil, handleError(err, "Error deleting property.")
	}

	return &id, nil
}

// DetectSiloSources is the resolver for the detectSiloSources field.
func (r *mutationResolver) DetectSiloSources(ctx context.Context, workspaceID string, id string) (*model.Job, error) {
	silo := model.SiloDefinition{}
	if err := r.Conf.DB.Where("id = ?", id).Where(
		"workspace_id = ?", workspaceID,
	).Preload("SiloSpecification").First(&silo).Error; err != nil {
		return nil, handleError(err, "Error finding silo.")
	}

	job := model.Job{
		ID:          uuid.NewString(),
		WorkspaceID: workspaceID,
		JobType:     model.JobTypeDiscoverSources,
		Status:      model.JobStatusQueued,
		ResourceID:  id,
	}

	analyticsData := map[string]interface{}{
		"action": "detect_silos",
		"siloId": silo.ID,
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&job).Error; err != nil {
			return err
		}

		options := client.StartWorkflowOptions{
			ID:        job.ID,
			TaskQueue: workflow.DockerRunnerQueue,
		}

		// Start the Workflow
		sf := workflow.Workflow{
			Conf: r.Conf,
		}

		wf, err := r.Conf.TemporalClient.ExecuteWorkflow(
			context.Background(),
			options,
			sf.DetectDSWorkflow,
			workflow.DetectDSArgs{
				SiloDefID:   silo.ID,
				WorkspaceID: silo.WorkspaceID,
				JobID:       job.ID,
			},
		)

		if err != nil {
			return err
		}

		if err := tx.Model(&job).Update("temporal_workflow_id", wf.GetID()).Error; err != nil {
			log.Err(err).Msg("Error uploading workflow ID")
		}

		return nil
	}); err != nil {
		return nil, handleError(err, "Error running job.")
	}

	return &job, nil
}

// Categories is the resolver for the categories field.
func (r *propertyResolver) Categories(ctx context.Context, obj *model.Property) ([]*model.Category, error) {
	return dataloader.PropertyCategories(ctx, obj.ID)
}

// DataSource is the resolver for the dataSource field.
func (r *propertyResolver) DataSource(ctx context.Context, obj *model.Property) (*model.DataSource, error) {
	ds := model.DataSource{}
	if err := r.Conf.DB.Unscoped().Model(obj).Association("DataSource").Find(&ds); err != nil {
		return nil, err
	}

	if ds.ID == "" {
		return nil, gqlerror.Errorf("Could not find data source.")
	}

	return &ds, nil
}

// DataSource is the resolver for the dataSource field.
func (r *queryResolver) DataSource(ctx context.Context, id string) (*model.DataSource, error) {
	return findObjectByID[model.DataSource](id, r.Conf.DB, "Error finding data source.")
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *queryResolver) SiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	return findObjectByID[model.SiloSpecification](id, r.Conf.DB, "Error finding silo specification.")
}

// Category is the resolver for the category field.
func (r *queryResolver) Category(ctx context.Context, id string) (*model.Category, error) {
	return findObjectByID[model.Category](id, r.Conf.DB, "Error finding category.")
}

// Property is the resolver for the property field.
func (r *queryResolver) Property(ctx context.Context, id string) (*model.Property, error) {
	return findObjectByID[model.Property](id, r.Conf.DB, "Error finding property.")
}

// Logo is the resolver for the logo field.
func (r *siloSpecificationResolver) Logo(ctx context.Context, obj *model.SiloSpecification) (*string, error) {
	if obj.LogoURL == nil {
		return nil, nil
	}

	data, err := os.ReadFile(filepath.Join(r.Conf.ResourcePath, "images", *obj.LogoURL))
	if err != nil {
		return nil, handleError(err, "Error getting logo.")
	}

	sdata := string(data)
	return &sdata, nil
}

// DataMap is the resolver for the dataMap field.
func (r *workspaceResolver) DataMap(ctx context.Context, obj *model.Workspace, query *model.DataMapQuery, limit int, offset *int) (*model.DataMapResult, error) {
	dataMap := []*model.DataMapRow{}
	off := 0
	if offset != nil {
		off = *offset
	}

	q := r.Conf.DB.Select(
		"silo_definitions.id as silo_definition_id",
		"data_sources.id as data_source_id",
		"properties.id as property_id",
		"silo_definitions.name",
		"data_sources.name",
		"properties.name",
	).Table("silo_definitions").Joins(
		"LEFT JOIN data_sources ON data_sources.silo_definition_id = silo_definitions.id AND data_sources.deleted_at is NULL",
	).Joins(
		"LEFT JOIN properties ON properties.data_source_id = data_sources.id",
	).Joins(
		"LEFT JOIN property_categories ON property_categories.property_id = properties.id",
	).Where("silo_definitions.workspace_id = ?", obj.ID)

	if query != nil {
		if query.Categories != nil {
			countQ := r.Conf.DB.Table("property_categories").Where(
				"property_categories.property_id = properties.id",
			)

			if query.Categories.AnyCategory != nil && *query.Categories.AnyCategory {
				q = q.Where("(?) > 0", countQ.Session(&gorm.Session{}).Select("COUNT(*)"))
			}

			if query.Categories.NoCategory != nil && *query.Categories.NoCategory {
				q = q.Where("(?) = 0", countQ.Session(&gorm.Session{}).Select("COUNT(*)"))
			}

			if len(query.Categories.CategoryIDs) > 0 {
				q = q.Where("(?) > 0", countQ.Session(&gorm.Session{}).Where(
					"property_categories.category_id IN ?",
					query.Categories.CategoryIDs,
				).Select("COUNT(*)"))
			}
		}

		if len(query.SiloDefinitions) != 0 {
			q = q.Where("silo_definitions.id IN ?", query.SiloDefinitions)
		}
	}

	if err := q.Session(&gorm.Session{}).Preload(
		"SiloDefinition",
	).Preload("DataSource").Preload(
		"Property",
	).Limit(limit).Offset(off).Order(
		"silo_definitions.name DESC, data_sources.name DESC, properties.name DESC",
	).Find(&dataMap).Error; err != nil {
		return nil, handleError(err, "Error getting data map")
	}

	cnt := int64(0)
	if err := q.Session(&gorm.Session{}).Count(&cnt).Error; err != nil {
		return nil, handleError(err, "Error getting number of data map rows")
	}

	return &model.DataMapResult{
		DataMapRows: dataMap,
		NumRows:     int(cnt),
	}, nil
}

// DataSource returns generated.DataSourceResolver implementation.
func (r *Resolver) DataSource() generated.DataSourceResolver { return &dataSourceResolver{r} }

// Property returns generated.PropertyResolver implementation.
func (r *Resolver) Property() generated.PropertyResolver { return &propertyResolver{r} }

// SiloSpecification returns generated.SiloSpecificationResolver implementation.
func (r *Resolver) SiloSpecification() generated.SiloSpecificationResolver {
	return &siloSpecificationResolver{r}
}

type dataSourceResolver struct{ *Resolver }
type propertyResolver struct{ *Resolver }
type siloSpecificationResolver struct{ *Resolver }
