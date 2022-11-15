package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"

	"github.com/brist-ai/monoid/model"
	"gorm.io/gorm"
)

// Jobs is the resolver for the jobs field.
func (r *queryResolver) Jobs(ctx context.Context, resourceID string, jobType string, status []*model.JobStatus, limit int, offset int) (*model.JobsResult, error) {
	jobs := []*model.Job{}

	q := r.Conf.DB.Debug().Order("created_at desc").Where("resource_id = ?", resourceID).Where("job_type = ?", jobType)
	if len(status) != 0 {
		q = q.Where("status IN ?", status)
	}

	if err := q.Session(&gorm.Session{}).Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, handleError(err, "Could not find jobs.")
	}

	numJobs := int64(0)
	if err := q.Session(&gorm.Session{}).Model(&model.Job{}).Count(&numJobs).Error; err != nil {
		return nil, handleError(err, "Error getting job count.")
	}

	fmt.Println(numJobs)

	return &model.JobsResult{
		Jobs:    jobs,
		NumJobs: int(numJobs),
	}, nil
}
