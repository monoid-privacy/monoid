package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"strings"

	"github.com/brist-ai/monoid/generated"
	"github.com/brist-ai/monoid/loader"
	"github.com/brist-ai/monoid/model"
	"gorm.io/gorm"
)

// SiloDefinition is the resolver for the siloDefinition field.
func (r *jobResolver) SiloDefinition(ctx context.Context, obj *model.Job) (*model.SiloDefinition, error) {
	if obj.JobType != model.JobTypeDiscoverSources {
		return nil, nil
	}

	return loader.GetSiloDefinition(ctx, obj.ResourceID)
}

// Jobs is the resolver for the jobs field.
func (r *queryResolver) Jobs(ctx context.Context, resourceID string, jobType string, query *string, status []*model.JobStatus, limit int, offset int) (*model.JobsResult, error) {
	jobs := []*model.Job{}

	q := r.Conf.DB.Order("created_at desc").Where("resource_id = ?", resourceID).Where("job_type = ?", jobType)
	if len(status) != 0 {
		q = q.Where("status IN ?", status)
	}

	if query != nil && strings.TrimSpace(*query) != "" {
		q = q.Where("id = ?", strings.TrimSpace(*query))
	}

	if err := q.Session(&gorm.Session{}).Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, handleError(err, "Could not find jobs.")
	}

	numJobs := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.Job{}).Count(&numJobs).Error; err != nil {
		return nil, handleError(err, "Error getting job count.")
	}

	return &model.JobsResult{
		Jobs:    jobs,
		NumJobs: int(numJobs),
	}, nil
}

// Jobs is the resolver for the jobs field.
func (r *workspaceResolver) Jobs(ctx context.Context, obj *model.Workspace, jobType string, status []*model.JobStatus, query *string, limit int, offset int) (*model.JobsResult, error) {
	jobs := []*model.Job{}

	q := r.Conf.DB.Order("created_at desc").Where("workspace_id = ?", obj.ID).Where(
		"job_type = ?",
		jobType,
	)

	if len(status) != 0 {
		q = q.Where("status IN ?", status)
	}

	if query != nil && strings.TrimSpace(*query) != "" {
		q = q.Where("id = ?", strings.TrimSpace(*query))
	}

	if err := q.Session(&gorm.Session{}).Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, handleError(err, "Could not find jobs.")
	}

	numJobs := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.Job{}).Count(&numJobs).Error; err != nil {
		return nil, handleError(err, "Error getting job count.")
	}

	return &model.JobsResult{
		Jobs:    jobs,
		NumJobs: int(numJobs),
	}, nil
}

// Job returns generated.JobResolver implementation.
func (r *Resolver) Job() generated.JobResolver { return &jobResolver{r} }

type jobResolver struct{ *Resolver }
