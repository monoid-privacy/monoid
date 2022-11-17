package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/loader"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow"
	"github.com/google/uuid"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
)

// SiloDefinition is the resolver for the siloDefinition field.
func (r *dataSourceResolver) SiloDefinition(ctx context.Context, obj *model.DataSource) (*model.SiloDefinition, error) {
	definition := model.SiloDefinition{}
	if err := r.Conf.DB.Where("id = ?", obj.SiloDefinitionID).First(&definition).Error; err != nil {
		return nil, err
	}

	return &definition, nil
}

// Properties is the resolver for the properties field.
func (r *dataSourceResolver) Properties(ctx context.Context, obj *model.DataSource) ([]*model.Property, error) {
	properties := []*model.Property{}

	if err := r.Conf.DB.Where("data_source_id = ?", obj.ID).Order("created_at desc, name asc").Find(&properties).Error; err != nil {
		return nil, handleError(err, "Error finding properties.")
	}

	return properties, nil
}

// RequestStatuses is the resolver for the requestStatuses field.
func (r *dataSourceResolver) RequestStatuses(ctx context.Context, obj *model.DataSource) ([]*model.RequestStatus, error) {
	return findChildObjects[model.RequestStatus](r.Conf.DB, obj.ID, "data_source_id")
}

// CreateDataSource is the resolver for the createDataSource field.
func (r *mutationResolver) CreateDataSource(ctx context.Context, input *model.CreateDataSourceInput) (*model.DataSource, error) {
	dataSource := model.DataSource{
		ID:               uuid.NewString(),
		SiloDefinitionID: input.SiloDefinitionID,
		Description:      input.Description,
	}

	if err := r.Conf.DB.Create(&dataSource).Error; err != nil {
		return nil, handleError(err, "Error creating dataSource.")
	}

	properties := []model.Property{}

	if err := r.Conf.DB.Where("id IN ?", input.PropertyIDs).Find(&properties).Error; err != nil {
		return nil, handleError(err, "Error finding properties.")
	}

	if err := r.Conf.DB.Model(&dataSource).Association("Properties").Append(properties); err != nil {
		return nil, handleError(err, "Error creating properties")
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
	}

	if err := r.Conf.DB.Create(&property).Error; err != nil {
		return nil, handleError(err, "Error creating property.")
	}

	categories := []model.Category{}

	if err := r.Conf.DB.Where("id IN ?", input.CategoryIDs).Find(&categories).Error; err != nil {
		return nil, handleError(err, "Error finding categories.")
	}

	if err := r.Conf.DB.Model(&property).Association("Categories").Append(categories); err != nil {
		return nil, handleError(err, "Error creating categories.")
	}

	purposes := []model.Purpose{}

	if err := r.Conf.DB.Where("id IN ?", input.PurposeIDs).Find(&purposes).Error; err != nil {
		return nil, handleError(err, "Error finding purposes.")
	}

	if err := r.Conf.DB.Model(&property).Association("Purposes").Append(purposes); err != nil {
		return nil, handleError(err, "Error creating purposes.")
	}

	return &property, nil
}

// CreatePurpose is the resolver for the createPurpose field.
func (r *mutationResolver) CreatePurpose(ctx context.Context, input *model.CreatePurposeInput) (*model.Purpose, error) {
	panic(fmt.Errorf("not implemented: CreatePurpose - createPurpose"))
}

// CreateCategory is the resolver for the createCategory field.
func (r *mutationResolver) CreateCategory(ctx context.Context, input *model.CreateCategoryInput) (*model.Category, error) {
	panic(fmt.Errorf("not implemented: CreateCategory - createCategory"))
}

// CreateSubject is the resolver for the createSubject field.
func (r *mutationResolver) CreateSubject(ctx context.Context, input *model.CreateSubjectInput) (*model.Subject, error) {
	panic(fmt.Errorf("not implemented: CreateSubject - createSubject"))
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

	// Updating purposes
	if input.PurposeIDs != nil {
		purposes := []model.Purpose{}

		if err := r.Conf.DB.Where("id IN ?", input.PurposeIDs).Find(&purposes).Error; err != nil {
			return nil, handleError(err, "Error updating property.")
		}

		if err := r.Conf.DB.Model(&property).Association("Purposes").Replace(&purposes); err != nil {
			return nil, handleError(err, "Error updating property.")
		}
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

// UpdatePurpose is the resolver for the updatePurpose field.
func (r *mutationResolver) UpdatePurpose(ctx context.Context, input *model.UpdatePurposeInput) (*model.Purpose, error) {
	panic(fmt.Errorf("not implemented: UpdatePurpose - updatePurpose"))
}

// UpdateCategory is the resolver for the updateCategory field.
func (r *mutationResolver) UpdateCategory(ctx context.Context, input *model.UpdateCategoryInput) (*model.Category, error) {
	panic(fmt.Errorf("not implemented: UpdateCategory - updateCategory"))
}

// UpdateSubject is the resolver for the updateSubject field.
func (r *mutationResolver) UpdateSubject(ctx context.Context, input *model.UpdateSubjectInput) (*model.Subject, error) {
	panic(fmt.Errorf("not implemented: UpdateSubject - updateSubject"))
}

// DeleteDataSource is the resolver for the deleteDataSource field.
func (r *mutationResolver) DeleteDataSource(ctx context.Context, id string) (*string, error) {
	dataSource := &model.DataSource{}

	if err := r.Conf.DB.Where("id = ?", id).First(dataSource).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	if err := r.Conf.DB.Delete(dataSource).Error; err != nil {
		return nil, handleError(err, "Error deleting data source.")
	}

	// TODO: Ensure that deletes cascade to properties (and purposes, categories for properties)

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
	return DeleteObjectByID[model.Property](id, r.Conf.DB, "Error deleting property.")
}

// DeletePurpose is the resolver for the deletePurpose field.
func (r *mutationResolver) DeletePurpose(ctx context.Context, id string) (*string, error) {
	return DeleteObjectByID[model.Purpose](id, r.Conf.DB, "Error deleting purpose.")
}

// DeleteCategory is the resolver for the deleteCategory field.
func (r *mutationResolver) DeleteCategory(ctx context.Context, id string) (*string, error) {
	return DeleteObjectByID[model.Category](id, r.Conf.DB, "Error deleting category.")
}

// DeleteSubject is the resolver for the deleteSubject field.
func (r *mutationResolver) DeleteSubject(ctx context.Context, id string) (*string, error) {
	return DeleteObjectByID[model.Subject](id, r.Conf.DB, "Error deleting subject.")
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

		_, err := r.Conf.TemporalClient.ExecuteWorkflow(
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

		return nil
	}); err != nil {
		return nil, handleError(err, "Error running job.")
	}

	return &job, nil
}

// Categories is the resolver for the categories field.
func (r *propertyResolver) Categories(ctx context.Context, obj *model.Property) ([]*model.Category, error) {
	return loader.GetCategories(ctx, obj.ID)
}

// DataSource is the resolver for the dataSource field.
func (r *propertyResolver) DataSource(ctx context.Context, obj *model.Property) (*model.DataSource, error) {
	ds := model.DataSource{}
	if err := r.Conf.DB.Model(obj).Association("DataSource").Find(&ds); err != nil {
		return nil, err
	}

	if ds.ID == "" {
		return nil, gqlerror.Errorf("Could not find data source.")
	}

	return &ds, nil
}

// UserPrimaryKey is the resolver for the userPrimaryKey field.
func (r *propertyResolver) UserPrimaryKey(ctx context.Context, obj *model.Property) (*model.UserPrimaryKey, error) {
	if obj.UserPrimaryKeyID == nil {
		return nil, nil
	}
	userPrimaryKeyId := obj.UserPrimaryKeyID
	return findObjectByID[model.UserPrimaryKey](*userPrimaryKeyId, r.Conf.DB, "Error finding user primary key.")
}

// DataSource is the resolver for the dataSource field.
func (r *queryResolver) DataSource(ctx context.Context, id string) (*model.DataSource, error) {
	return findObjectByID[model.DataSource](id, r.Conf.DB, "Error finding data source.")
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *queryResolver) SiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	return findObjectByID[model.SiloSpecification](id, r.Conf.DB, "Error finding silo specification.")
}

// SiloSpecifications is the resolver for the siloSpecifications field.
func (r *queryResolver) SiloSpecifications(ctx context.Context) ([]*model.SiloSpecification, error) {
	return findAllObjects[model.SiloSpecification](r.Conf.DB, "Error finding silo specifications.")
}

// Purposes is the resolver for the purposes field.
func (r *queryResolver) Purposes(ctx context.Context) ([]*model.Purpose, error) {
	return findAllObjects[model.Purpose](r.Conf.DB, "Error finding purposes.")
}

// Categories is the resolver for the categories field.
func (r *queryResolver) Categories(ctx context.Context) ([]*model.Category, error) {
	return findAllObjects[model.Category](r.Conf.DB, "Error finding categories.")
}

// Subjects is the resolver for the subjects field.
func (r *queryResolver) Subjects(ctx context.Context) ([]*model.Subject, error) {
	return findAllObjects[model.Subject](r.Conf.DB, "Error finding silo subjects.")
}

// Purpose is the resolver for the purpose field.
func (r *queryResolver) Purpose(ctx context.Context, id string) (*model.Purpose, error) {
	return findObjectByID[model.Purpose](id, r.Conf.DB, "Error finding purpose.")
}

// Category is the resolver for the category field.
func (r *queryResolver) Category(ctx context.Context, id string) (*model.Category, error) {
	return findObjectByID[model.Category](id, r.Conf.DB, "Error finding category.")
}

// Subject is the resolver for the subject field.
func (r *queryResolver) Subject(ctx context.Context, id string) (*model.Subject, error) {
	return findObjectByID[model.Subject](id, r.Conf.DB, "Error finding subject.")
}

// Property is the resolver for the property field.
func (r *queryResolver) Property(ctx context.Context, id string) (*model.Property, error) {
	return findObjectByID[model.Property](id, r.Conf.DB, "Error finding property.")
}

// DataSource returns generated.DataSourceResolver implementation.
func (r *Resolver) DataSource() generated.DataSourceResolver { return &dataSourceResolver{r} }

// Property returns generated.PropertyResolver implementation.
func (r *Resolver) Property() generated.PropertyResolver { return &propertyResolver{r} }

type dataSourceResolver struct{ *Resolver }
type propertyResolver struct{ *Resolver }
