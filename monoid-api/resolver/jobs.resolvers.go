package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"bufio"
	"context"
	"fmt"
	"strings"

	"github.com/monoid-privacy/monoid/generated"
	"github.com/monoid-privacy/monoid/loader"
	"github.com/monoid-privacy/monoid/model"
	"gorm.io/gorm"
)

// SiloDefinition is the resolver for the siloDefinition field.
func (r *jobResolver) SiloDefinition(ctx context.Context, obj *model.Job) (*model.SiloDefinition, error) {
	if obj.JobType != model.JobTypeDiscoverSources {
		return nil, nil
	}

	return loader.SiloDefinition(ctx, obj.ResourceID)
}

// Logs is the resolver for the logs field.
func (r *jobResolver) Logs(ctx context.Context, obj *model.Job) ([]string, error) {
	if obj.LogObject == "" {
		return []string{}, nil
	}

	reader, err := r.Conf.FileStore.NewReader(ctx, obj.LogObject, true)
	if err != nil {
		return nil, handleError(err, "Error getting jobs")
	}

	logLines := []string{}
	sc := bufio.NewScanner(reader)
	for sc.Scan() {
		logLines = append(logLines, sc.Text())
	}

	return logLines, nil
}

// CancelJob is the resolver for the cancelJob field.
func (r *mutationResolver) CancelJob(ctx context.Context, id string) (*model.Job, error) {
	job := model.Job{}
	if err := r.Conf.DB.Where(
		"id = ?", id,
	).First(&job).Error; err != nil {
		return nil, handleError(err, "Error cancelling job")
	}

	if job.TemporalWorkflowID == "" {
		return nil, handleError(
			fmt.Errorf("workflow id is nil"),
			"Job is still initializing, try again in a few seconds.",
		)
	}

	if err := r.Conf.TemporalClient.CancelWorkflow(ctx, job.TemporalWorkflowID, ""); err != nil {
		return nil, handleError(err, "Error cancelling job")
	}

	if err := r.Conf.DB.Model(&job).Update("status", model.JobStatusFailed).Error; err != nil {
		return nil, handleError(err, "Error updating state")
	}

	return &job, nil
}

// Jobs is the resolver for the jobs field.
func (r *workspaceResolver) Jobs(ctx context.Context, obj *model.Workspace, jobType string, resourceID *string, status []*model.JobStatus, query *string, limit int, offset int) (*model.JobsResult, error) {
	jobs := []*model.Job{}

	q := r.Conf.DB.Order("created_at desc").Where("workspace_id = ?", obj.ID).Where(
		"job_type = ?",
		jobType,
	)

	if len(status) != 0 {
		q = q.Where("status IN ?", status)
	}

	if resourceID != nil {
		q = q.Where("resource_id = ?", *resourceID)
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

// Job is the resolver for the job field.
func (r *workspaceResolver) Job(ctx context.Context, obj *model.Workspace, id string) (*model.Job, error) {
	job := model.Job{}
	if err := r.Conf.DB.Where(
		"workspace_id = ?",
		obj.ID,
	).Where("id = ?", id).First(&job).Error; err != nil {
		return nil, handleError(err, "Error getting job")
	}

	return &job, nil
}

// Job returns generated.JobResolver implementation.
func (r *Resolver) Job() generated.JobResolver { return &jobResolver{r} }

type jobResolver struct{ *Resolver }
