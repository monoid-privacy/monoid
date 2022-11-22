package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/jsonschema"
	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/workflow"
	"github.com/google/uuid"
	cron "github.com/robfig/cron/v3"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"go.temporal.io/sdk/client"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CreateSiloDefinition is the resolver for the createSiloDefinition field.
func (r *mutationResolver) CreateSiloDefinition(ctx context.Context, input *model.CreateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{
		ID:                  uuid.NewString(),
		Name:                input.Name,
		WorkspaceID:         input.WorkspaceID,
		Description:         input.Description,
		SiloSpecificationID: input.SiloSpecificationID,
	}

	if input.SiloData != nil {
		siloDefinition.Config = model.SecretString(*input.SiloData)
	}

	siloSpec := model.SiloSpecification{}
	if err := r.Conf.DB.Where("id = ?", siloDefinition.SiloSpecificationID).First(&siloSpec).Error; err != nil {
		return nil, handleError(err, "Silo specification doesn't exist.")
	}

	siloDefinition.SiloSpecification = siloSpec

	res, err := r.validateSiloDef(
		ctx,
		fmt.Sprintf("ws-%s/silo-%s-%s", input.WorkspaceID, siloSpec.DockerImage, siloDefinition.ID),
		siloDefinition,
	)

	analyticsData := map[string]interface{}{
		"action": "create",
		"siloId": siloDefinition.ID,
	}

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
		analyticsData["action"] = "create_validate_failed"
		r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

		return nil, gqlerror.Errorf(res.message)
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

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	return &siloDefinition, nil
}

// UpdateSiloDefinition is the resolver for the updateSiloDefinition field.
func (r *mutationResolver) UpdateSiloDefinition(ctx context.Context, input *model.UpdateSiloDefinitionInput) (*model.SiloDefinition, error) {
	siloDefinition := model.SiloDefinition{}

	if err := r.Conf.DB.Where(
		"id = ?",
		input.ID,
	).Where(
		"workspace_id = ?",
		input.WorkspaceID,
	).Preload("SiloSpecification").First(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	if input.Name != nil {
		siloDefinition.Name = *input.Name
	}

	siloDefinition.Description = input.Description

	if input.SiloData != nil {
		data := map[string]interface{}{}
		if err := json.Unmarshal([]byte(*input.SiloData), &data); err != nil {
			return nil, handleError(err, "Invalid config.")
		}

		oldData := map[string]interface{}{}
		if err := json.Unmarshal([]byte(siloDefinition.Config), &oldData); err != nil {
			log.Err(err).Msg("Error unmarshalling old config.")
		}

		schemaStr := siloDefinition.SiloSpecification.Schema
		if schemaStr != nil {
			schema := jsonschema.Schema{}
			if err := json.Unmarshal([]byte(*schemaStr), &schema); err != nil {
				return nil, handleError(err, "Could not parse schema.")
			}

			res := jsonschema.MergeData(oldData, data, &schema)

			resJSON, err := json.Marshal(&res)
			if err != nil {
				return nil, handleError(err, "Could not validate config.")
			}

			siloDefinition.Config = model.SecretString(resJSON)
		} else {
			siloDefinition.Config = model.SecretString(*input.SiloData)
		}
	}

	subjects := []model.Subject{}

	if err := r.Conf.DB.Where("id IN ?", input.SubjectIDs).Find(&subjects).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	analyticsData := map[string]interface{}{
		"action": "update",
		"siloId": siloDefinition.ID,
	}

	// Validate the definition before saving it
	res, err := r.validateSiloDef(
		ctx,
		fmt.Sprintf(
			"ws-%s/silo-%s-%s",
			input.WorkspaceID,
			siloDefinition.SiloSpecification.DockerImage,
			siloDefinition.ID,
		),
		siloDefinition,
	)

	if err != nil {
		return nil, handleError(err, "Error validating silo definition")
	}

	if !res.success {
		analyticsData["action"] = "update_validate_failed"
		r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)
		return nil, gqlerror.Errorf(res.message)
	}

	if err := r.Conf.DB.Model(&siloDefinition).Association("Subjects").Replace(subjects); err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	if err := r.Conf.DB.Omit("Subjects").Updates(&siloDefinition).Error; err != nil {
		return nil, handleError(err, "Error updating silo definition.")
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	return &siloDefinition, nil
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

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, map[string]interface{}{
		"action": "delete",
		"siloId": id,
	})

	// TODO: Check that deletes properly cascade to subjects (m2m) and datasources (12m)

	return &id, nil
}

// UpdateSiloScanConfig is the resolver for the updateSiloScanConfig field.
func (r *mutationResolver) UpdateSiloScanConfig(ctx context.Context, input model.SiloScanConfigInput) (*model.SiloDefinition, error) {
	silo := model.SiloDefinition{}
	if err := r.Conf.DB.Preload("ScanConfig").Preload(
		"SiloSpecification",
	).Where("id = ?", input.SiloID).First(&silo).Error; err != nil {
		return nil, handleError(err, "Silo not found.")
	}

	if silo.ScanConfig != nil && silo.ScanConfig.WorkflowID != nil && *silo.ScanConfig.WorkflowID != "" {
		if err := r.Conf.TemporalClient.CancelWorkflow(ctx, *silo.ScanConfig.WorkflowID, ""); err != nil {
			return nil, handleError(err, "Unable to remove existing scan configuration.")
		}
	}

	analyticsData := map[string]interface{}{
		"siloId": silo.ID,
	}

	if input.Cron == "" {
		analyticsData["action"] = "updateScanTimeManual"

		if err := r.Conf.DB.Model(&silo).Association("ScanConfig").Clear(); err != nil {
			return nil, handleError(err, "Unable to save new scan configuration.")
		}

		r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

		return &silo, nil
	}

	analyticsData["action"] = "updateScanTimeAuto"

	// Validate that the cron config is valid, and will run at most once per hour.
	validator := cron.NewParser(
		cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow,
	)

	_, err := validator.Parse(input.Cron)
	if err != nil {
		return nil, handleError(err, "Invalid cron string.")
	}

	// If the minutes have anything but in integer, it might run
	// more than once per hour
	spl := strings.Fields(input.Cron)
	re := regexp.MustCompile("^(?:(?:[0-9][0-9]?))$")
	if !re.MatchString(spl[0]) {
		return nil, handleError(fmt.Errorf("invalid cron"), "Workflows can execute at most once per hour.")
	}

	workflowOptions := client.StartWorkflowOptions{
		CronSchedule: input.Cron,
		TaskQueue:    workflow.DockerRunnerQueue,
	}

	// Start the Workflow
	sf := workflow.Workflow{
		Conf: r.Conf,
	}

	workflow, err := r.Conf.TemporalClient.ExecuteWorkflow(
		context.Background(),
		workflowOptions,
		sf.DetectDSWorkflow,
		workflow.DetectDSArgs{
			SiloDefID:   silo.ID,
			WorkspaceID: silo.WorkspaceID,
		},
	)

	if err != nil {
		return nil, handleError(err, "Error scheduling workflow.")
	}

	// Save the config to the db.
	workflowID := workflow.GetID()

	if err := r.Conf.DB.Transaction(func(tx *gorm.DB) error {
		if err := r.Conf.DB.Model(&model.SiloScanConfig{}).Where(
			"silo_definition_id = ?",
			silo.ID,
		).Delete(nil).Error; err != nil {
			return err
		}

		if err := r.Conf.DB.Clauses(
			clause.OnConflict{DoNothing: true},
		).Create(&model.SiloScanConfig{
			SiloDefinitionID: silo.ID,
			Cron:             &input.Cron,
			WorkflowID:       &workflowID,
		}).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, handleError(err, "Unable to save new scan configuration.")
	}

	r.Conf.AnalyticsIngestor.Track("siloAction", nil, analyticsData)

	return &silo, nil
}

// SiloSpecification is the resolver for the siloSpecification field.
func (r *siloDefinitionResolver) SiloSpecification(ctx context.Context, obj *model.SiloDefinition) (*model.SiloSpecification, error) {
	spec := model.SiloSpecification{}
	if err := r.Conf.DB.Where(
		"id = ?",
		obj.SiloSpecificationID,
	).First(&spec).Error; err != nil {
		return nil, handleError(err, "Error finding specifications")
	}

	return &spec, nil
}

// DataSources is the resolver for the dataSources field.
func (r *siloDefinitionResolver) DataSources(ctx context.Context, obj *model.SiloDefinition) ([]*model.DataSource, error) {
	sources := []*model.DataSource{}
	if err := r.Conf.DB.Where(
		"silo_definition_id = ?", obj.ID,
	).Order(clause.OrderByColumn{Column: clause.Column{Name: "group"}}).Order(
		clause.OrderByColumn{Column: clause.Column{Name: "name"}},
	).Find(&sources).Error; err != nil {
		return nil, handleError(err, "Error finding data sources")
	}

	return sources, nil
}

// SiloConfig is the resolver for the siloConfig field.
func (r *siloDefinitionResolver) SiloConfig(ctx context.Context, obj *model.SiloDefinition) (map[string]interface{}, error) {
	siloSpec := model.SiloSpecification{}

	if err := r.Conf.DB.Where("id = ?", obj.SiloSpecificationID).First(&siloSpec).Error; err != nil {
		return nil, err
	}

	res := map[string]interface{}{}
	if err := json.Unmarshal([]byte(obj.Config), &res); err != nil {
		return nil, handleError(err, "Error decoding config.")
	}

	if siloSpec.Schema == nil {
		return res, nil
	}

	schema := jsonschema.Schema{}
	if err := json.Unmarshal([]byte(*siloSpec.Schema), &schema); err != nil {
		return nil, handleError(err, "Could not parse schema.")
	}

	jsonschema.HideSecrets(res, &schema)

	return res, nil
}

// ScanConfig is the resolver for the scanConfig field.
func (r *siloDefinitionResolver) ScanConfig(ctx context.Context, obj *model.SiloDefinition) (*model.SiloScanConfig, error) {
	scanConfig := model.SiloScanConfig{}
	if err := r.Conf.DB.Where("silo_definition_id = ?", obj.ID).First(&scanConfig).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &model.SiloScanConfig{
				SiloDefinitionID: obj.ID,
				Cron:             str(""),
				WorkflowID:       str(""),
			}, nil
		}

		return nil, handleError(err, "Error running query.")
	}

	return &scanConfig, nil
}

// SiloDefinitions is the resolver for the siloDefinitions field.
func (r *workspaceResolver) SiloDefinitions(ctx context.Context, obj *model.Workspace) ([]*model.SiloDefinition, error) {
	defs := []*model.SiloDefinition{}
	if err := r.Conf.DB.Model(obj).Association("SiloDefinitions").Find(&defs); err != nil {
		return nil, handleError(err, "Error getting definitions.")
	}

	return defs, nil
}

// SiloDefinition is the resolver for the siloDefinition field.
func (r *workspaceResolver) SiloDefinition(ctx context.Context, obj *model.Workspace, id string) (*model.SiloDefinition, error) {
	silo := &model.SiloDefinition{}
	if err := r.Conf.DB.Where(
		"id = ?",
		id,
	).Where("workspace_id = ?", obj.ID).First(silo).Error; err != nil {
		return nil, handleError(err, "Error finding silo definition.")
	}

	return silo, nil
}

// SiloDefinition returns generated.SiloDefinitionResolver implementation.
func (r *Resolver) SiloDefinition() generated.SiloDefinitionResolver {
	return &siloDefinitionResolver{r}
}

type siloDefinitionResolver struct{ *Resolver }
