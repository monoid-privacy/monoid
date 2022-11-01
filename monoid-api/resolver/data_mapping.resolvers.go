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
func (r *mutationResolver) CreateSiloDefinition(ctx context.Context, input *model.CreateSiloDefinitionInput) (*string, error) {
	siloDefinition := model.SiloDefinition{
		ID:                  uuid.NewString(),
		WorkspaceID:         input.WorkspaceID,
		Description:         input.Description,
		SiloSpecificationID: input.SiloSpecificationID,
		Subjects:            []model.Subject{}, // TODO: Many2many creation for subjects? Pass array of ID's or array of subjects?
	}

	if err := r.Conf.DB.Create(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error creating silo definition.")
	}

	return &siloDefinition.ID, nil
}

// CreateDataSource is the resolver for the createDataSource field.
func (r *mutationResolver) CreateDataSource(ctx context.Context, input *model.CreateDataSourceInput) (*string, error) {
	dataSource := model.DataSource{
		ID:               uuid.NewString(),
		SiloDefinitionID: input.SiloDefinitionID,
		Description:      input.Description,
	}

	if err := r.Conf.DB.Create(&dataSource).Error; err != nil {
		return nil, handleError(err, "Error creating dataSource.")
	}

	return &dataSource.ID, nil
}

// CreateSiloSpecification is the resolver for the createSiloSpecification field.
func (r *mutationResolver) CreateSiloSpecification(ctx context.Context, input *model.CreateSiloSpecificationInput) (*string, error) {
	siloSpecification := model.SiloSpecification{
		ID:          uuid.NewString(),
		Name:        input.Name,
		LogoURL:     input.LogoURL,
		WorkspaceID: input.WorkspaceID,
		DockerImage: input.DockerImage,
	}

	if err := r.Conf.DB.Create(&siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error creating silo specification.")
	}

	return &siloSpecification.ID, nil
}

// CreateProperty is the resolver for the createProperty field.
func (r *mutationResolver) CreateProperty(ctx context.Context, input *model.CreatePropertyInput) (*string, error) {
	property := model.Property{
		ID:           uuid.NewString(),
		DataSourceID: input.DataSourceID,
	}

	if err := r.Conf.DB.Create(&property).Error; err != nil {
		return nil, handleError(err, "Error creating property.")
	}

	categories := []model.Category{}

	if err := r.Conf.DB.Where("id IN ?", input.Categories).Find(&categories).Error; err != nil {
		return nil, handleError(err, "Error finding categories.")
	}

	if err := r.Conf.DB.Model(&property).Association("Categories").Append(categories); err != nil {
		return nil, handleError(err, "Error creating categories.")
	}

	purposes := []model.Purpose{}

	if err := r.Conf.DB.Where("id IN ?", input.Purposes).Find(&purposes).Error; err != nil {
		return nil, handleError(err, "Error finding purposes.")
	}

	if err := r.Conf.DB.Model(&property).Association("Purposes").Append(purposes); err != nil {
		return nil, handleError(err, "Error creating purposes.")
	}

	return &property.ID, nil
}

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", input.ID).First(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if input.Description != nil {
		siloDefinition.Description = input.Description
	}

	if input.SiloSpecificationID != nil {
		siloDefinition.SiloSpecificationID = *input.SiloSpecificationID
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

	if input.Description != nil {
		dataSource.Description = input.Description
	}

	if input.SiloDefinitionID != nil {
		dataSource.SiloDefinitionID = *input.SiloDefinitionID
	}

	// TODO: Deal with properties
	panic(fmt.Errorf("not implemented: UpdateDataSource - updating properties"))

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
		siloSpecification.DockerImage = input.DockerImage
	}

	if input.Name != nil {
		siloSpecification.Name = *input.Name
	}

	if input.LogoURL != nil {
		siloSpecification.LogoURL = input.LogoURL
	}

	if input.Schema != nil {
		siloSpecification.Schema = input.Schema
	}

	if err := r.Conf.DB.Save(&siloSpecification).Error; err != nil {
		return nil, handleError(err, "Error updating silo specification.")
	}

	return &siloSpecification, nil
}

// UpdateProperty is the resolver for the updateProperty field.
func (r *mutationResolver) UpdateProperty(ctx context.Context, input *model.UpdatePropertyInput) (*model.Property, error) {
	panic(fmt.Errorf("not implemented: UpdateProperty - updateProperty"))
}

// DeleteSiloDefinition is the resolver for the deleteSiloDefinition field.
func (r *mutationResolver) DeleteSiloDefinition(ctx context.Context, id string) (*string, error) {
	siloDefinition := &model.SiloDefinition{}

	if err := r.Conf.DB.Where("id = ?", id).First(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if err := r.Conf.DB.Delete(siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error deleting silo definition.")
	}

	// TODO: Properly handle cascading delete
	panic(fmt.Errorf("not implemented: DeleteSiloDefinition - deleting data sources"))

	return &id, nil
}

// DeleteDataSource is the resolver for the deleteDataSource field.
func (r *mutationResolver) DeleteDataSource(ctx context.Context, id string) (*string, error) {
	dataSource := &model.DataSource{}

	if err := r.Conf.DB.Where("id = ?", id).First(dataSource).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	panic(fmt.Errorf("not implemented: DeleteDataSource - deleting properties"))

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

	if err := r.Conf.DB.Model(&model.SiloDefinition{}).
		Where("silo_specification_id = ?", siloSpecification.ID).Update("silo_specification_id", nil).Error; err != nil {
		return nil, handleError(err, "Error deleting silo specifications from silo definition.")
	}

	return &id, nil
}

// DeleteProperty is the resolver for the deleteProperty field.
func (r *mutationResolver) DeleteProperty(ctx context.Context, id string) (*string, error) {
	property := &model.Property{}

	if err := r.Conf.DB.Where("id = ?", id).First(property).Error; err != nil {
		return nil, handleError(err, "Error finding property.")
	}

	categories := []model.Category{}

	if err := r.Conf.DB.Model(property).Association("Categories").Find(&categories); err != nil {
		return nil, handleError(err, "Error finding categories")
	}

	if err := r.Conf.DB.Model(property).Association("Categories").Delete(&categories); err != nil {
		return nil, handleError(err, "Error deleting categories")
	}

	purposes := []model.Purpose{}

	if err := r.Conf.DB.Model(property).Association("Purposes").Find(&purposes); err != nil {
		return nil, handleError(err, "Error finding purposes")
	}

	if err := r.Conf.DB.Model(property).Association("Purposes").Delete(&categories); err != nil {
		return nil, handleError(err, "Error deleting purposes")
	}

	if err := r.Conf.DB.Delete(property).Error; err != nil {
		return nil, handleError(err, "Error deleting property.")
	}

	return &id, nil
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

// SiloDefinitions is the resolver for the siloDefinitions field.
func (r *queryResolver) SiloDefinitions(ctx context.Context, wsID string) ([]*model.SiloDefinition, error) {
	silos := []*model.SiloDefinition{}
	if err := r.Conf.DB.Where("workspace_id = ?", wsID).Find(&silos).Error; err != nil {
		return nil, handleError(err, "Error finding silo definitions.")
	}

	return silos, nil
}

// DataSources is the resolver for the dataSources field.
func (r *queryResolver) DataSources(ctx context.Context, wsID string) ([]*model.DataSource, error) {
	dataSources := []*model.DataSource{}
	if err := r.Conf.DB.Where("workspace_id = ?", wsID).Find(&dataSources).Error; err != nil {
		return nil, handleError(err, "Error finding data source.")
	}

	return dataSources, nil
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
func (r *queryResolver) SiloSpecifications(ctx context.Context, wsID string) ([]*model.SiloSpecification, error) {
	siloSpecifications := []*model.SiloSpecification{}
	if err := r.Conf.DB.Where("workspace_id = ? OR workspace_id IS NULL", wsID).Find(&siloSpecifications).Error; err != nil {
		return nil, handleError(err, "Error finding silo specifications.")
	}

	return siloSpecifications, nil
}

// Property is the resolver for the property field.
func (r *queryResolver) Property(ctx context.Context, id string) (*model.Property, error) {
	property := &model.Property{}
	if err := r.Conf.DB.Where("id = ?", id).First(property).Error; err != nil {
		return nil, handleError(err, "Error finding property.")
	}

	return property, nil
}

// Properties is the resolver for the properties field.
func (r *queryResolver) Properties(ctx context.Context, wsID string) ([]*model.Property, error) {
	properties := []*model.Property{}
	if err := r.Conf.DB.Where("workspace_id = ?", wsID).Find(&properties).Error; err != nil {
		return nil, handleError(err, "Error finding properties.")
	}

	return properties, nil
}
