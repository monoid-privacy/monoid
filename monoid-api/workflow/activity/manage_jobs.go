package activity

import (
	"context"

	"github.com/brist-ai/monoid/model"
	"github.com/google/uuid"
	"go.temporal.io/sdk/activity"
)

type JobInput struct {
	ID          string          `json:"id"`
	WorkspaceID string          `json:"workspaceId"`
	JobType     string          `json:"jobType"`
	ResourceID  string          `json:"resourceId"`
	Status      model.JobStatus `json:"jobStatus"`
}

func (a *Activity) FindOrCreateJob(ctx context.Context, jobIn JobInput) (model.Job, error) {
	logger := activity.GetLogger(ctx)

	jobID := jobIn.ID
	if jobID == "" {
		jobID = uuid.NewString()
	}

	job := model.Job{
		ID:          jobID,
		WorkspaceID: jobIn.WorkspaceID,
		JobType:     jobIn.JobType,
		ResourceID:  jobIn.ResourceID,
		Status:      jobIn.Status,
	}

	if err := a.Conf.DB.Where("id = ?", jobIn.ID).First(&job).Error; err != nil {
		if err := a.Conf.DB.Create(&job).Error; err != nil {
			return model.Job{}, err
		}
	}

	wr, path, err := a.Conf.FileStore.NewWriter(ctx, uuid.NewString(), false)
	if err != nil {
		logger.Error("Error creating file store")
	}

	wr.Close()

	if err := a.Conf.DB.Model(&job).Update("log_object", path).Error; err != nil {
		logger.Error("Error setting log object", err)
	}

	return job, nil
}

type JobStatusInput struct {
	ID     string          `json:"id"`
	Status model.JobStatus `json:"status"`
}

func (a *Activity) UpdateJobStatus(ctx context.Context, statusIn JobStatusInput) error {
	return a.Conf.DB.Updates(&model.Job{
		ID:     statusIn.ID,
		Status: statusIn.Status,
	}).Error
}
