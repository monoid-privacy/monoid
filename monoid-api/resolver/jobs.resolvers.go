package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/brist-ai/monoid/model"
)

// Jobs is the resolver for the jobs field.
func (r *queryResolver) Jobs(ctx context.Context, resourceID string, jobType string, status []*model.JobStatus) ([]*model.Job, error) {
	jobs := []*model.Job{}

	q := r.Conf.DB.Order("created_at desc").Where("resource_id = ?", resourceID).Where("job_type = ?", jobType)
	if len(status) != 0 {
		q = q.Where("status IN ?", status)
	}

	if err := q.Find(&jobs).Error; err != nil {
		return nil, handleError(err, "Could not find jobs.")
	}

	return jobs, nil
}
