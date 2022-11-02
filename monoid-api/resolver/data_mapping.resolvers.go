package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
)

// CreateSiloDefinition is the resolver for the createSiloDefinition field.
func (r *mutationResolver) CreateSiloDefinition(ctx context.Context, input *model.CreateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{
		ID:                  uuid.NewString(),
		WorkspaceID:         input.WorkspaceID,
		Description:         input.Description,
		SiloSpecificationID: input.SiloSpecificationID,
	}

	if err := r.Conf.DB.Create(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error creating silo definition.")
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Find(&subjects).Error; err != nil {
		return nil, handleError(err, "Error finding subjects.")
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Append(subjects); err != nil {
		return nil, handleError(err, "Error creating subjects.")
	}

	return &siloDefinition, nil
}

// CreateDataSource is the resolver for the createDataSource field.
func (r *mutationResolver) CreateDataSource(ctx context.Context, input *model.CreateDataSourceInput) (*model.DataSource, error) {
	dataSource := model.DataSource{
		ID:               uuid.NewString(),
		SiloDefinitionID: input.SiloDefinitionID,
		Description:      input.Description,
		Schema:           input.Schema,
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
		WorkspaceID: input.WorkspaceID,
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

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	siloDefinition.Description = input.Description

	if input.SiloSpecificationID != nil {
		siloDefinition.SiloSpecificationID = *input.SiloSpecificationID
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Find(subjects).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Replace(subjects); err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	if err := r.Conf.DB.Save(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	return &siloDefinition, nil
}

// UpdateDataSource is the resolver for the updateDataSource field.
func (r *mutationResolver) UpdateDataSource(ctx context.Context, input *model.UpdateDataSourceInput) (*model.DataSource, error) {
	dataSource := model.DataSource{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&dataSource).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	dataSource.Description = input.Description

	if input.Schema != nil {
		dataSource.Schema = *input.Schema
	}

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
	purposes := []model.Purpose{}

	if err := r.Conf.DB.Where("id IN ?", input.PurposeIDs).Find(purposes).Error; err != nil {
		return nil, handleError(err, "Error updating property.")
	}

	if err := r.Conf.DB.Model(&property).Association("Purposes").Replace(purposes); err != nil {
		return nil, handleError(err, "Error updating property.")
	}

	// Updating categories
	categories := []model.Category{}

	if err := r.Conf.DB.Where("id IN ?", input.CategoryIDs).Find(categories).Error; err != nil {
		return nil, handleError(err, "Error updating property.")
	}

	if err := r.Conf.DB.Model(&property).Association("Categories").Replace(categories); err != nil {
		return nil, handleError(err, "Error updating property.")
	}

	if err := r.Conf.DB.Save(&property).Error; err != nil {
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

// DeleteSiloDefinition is the resolver for the deleteSiloDefinition field.
func (r *mutationResolver) DeleteSiloDefinition(ctx context.Context, id string) (*string, error) {
	siloDefinition := &model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", id).Preload("Subjects").Preload("DataSources").First(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if err := r.Conf.DB.Delete(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error deleting silo definition.")
	}

	// TODO: Check that deletes properly cascade to subjects (m2m) and datasources (12m)

	return &id, nil
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
	property := &model.Property{}

	if err := r.Conf.DB.Where("id = ?", id).First(property).Error; err != nil {
		return nil, handleError(err, "Error finding property.")
	}

	if err := r.Conf.DB.Delete(property).Error; err != nil {
		return nil, handleError(err, "Error deleting property.")
	}

	// TODO: Ensure that associations to purpose, category disappear

	return &id, nil
}

// DeletePurpose is the resolver for the deletePurpose field.
func (r *mutationResolver) DeletePurpose(ctx context.Context, id string) (*string, error) {
	panic(fmt.Errorf("not implemented: DeletePurpose - deletePurpose"))
}

// DeleteCategory is the resolver for the deleteCategory field.
func (r *mutationResolver) DeleteCategory(ctx context.Context, id string) (*string, error) {
	panic(fmt.Errorf("not implemented: DeleteCategory - deleteCategory"))
}

// DeleteSubject is the resolver for the deleteSubject field.
func (r *mutationResolver) DeleteSubject(ctx context.Context, id string) (*string, error) {
	panic(fmt.Errorf("not implemented: DeleteSubject - deleteSubject"))
}

// SiloDefinition is the resolver for the siloDefinition field.
func (r *queryResolver) SiloDefinition(ctx context.Context, id string) (*model.SiloDefinition, error) {
	silo := &model.SiloDefinition{}
	if err := r.Conf.DB.Where("id = ?", id).First(silo).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	return silo, nil
}

// DataSource is the resolver for the dataSource field.
func (r *queryResolver) DataSource(ctx context.Context, id string) (*model.DataSource, error) {
	dataSource := &model.DataSource{}
	if err := r.Conf.DB.Where("id = ?", id).First(dataSource).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	return dataSource, nil
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *queryResolver) SiloSpecification(ctx context.Context, id string) (*model.SiloSpecification, error) {
	siloSpecification := &model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", id).First(siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error finding silo specification.")
	}

	return siloSpecification, nil
}

// SiloSpecifications is the resolver for the siloSpecifications field.
func (r *queryResolver) SiloSpecifications(ctx context.Context) ([]*model.SiloSpecification, error) {
	panic(fmt.Errorf("not implemented: SiloSpecifications - siloSpecifications"))
}

// Purposes is the resolver for the purposes field.
func (r *queryResolver) Purposes(ctx context.Context) ([]*model.Purpose, error) {
	panic(fmt.Errorf("not implemented: Purposes - purposes"))
}

// Categories is the resolver for the categories field.
func (r *queryResolver) Categories(ctx context.Context) ([]*model.Category, error) {
	panic(fmt.Errorf("not implemented: Categories - categories"))
}

// Subjects is the resolver for the subjects field.
func (r *queryResolver) Subjects(ctx context.Context) ([]*model.Subject, error) {
	panic(fmt.Errorf("not implemented: Subjects - subjects"))
}

// Purpose is the resolver for the purpose field.
func (r *queryResolver) Purpose(ctx context.Context, id string) (*model.Purpose, error) {
	panic(fmt.Errorf("not implemented: Purpose - purpose"))
}

// Category is the resolver for the category field.
func (r *queryResolver) Category(ctx context.Context, id string) (*model.Category, error) {
	panic(fmt.Errorf("not implemented: Category - category"))
}

// Subject is the resolver for the subject field.
func (r *queryResolver) Subject(ctx context.Context, id string) (*model.Subject, error) {
	panic(fmt.Errorf("not implemented: Subject - subject"))
}

// Property is the resolver for the property field.
func (r *queryResolver) Property(ctx context.Context, id string) (*model.Property, error) {
	property := &model.Property{}
	if err := r.Conf.DB.Where("id = ?", id).First(property).Error; err != nil {
		return nil, handleError(err, "Error finding property.")
	}

	return property, nil
}
