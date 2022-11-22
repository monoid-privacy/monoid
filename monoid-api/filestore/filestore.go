package filestore

import (
	"context"
	"io"
)

type FileStore interface {
	// NewWriter returns an io.Writer for the file handle you can write to
	// and the path to access the file. Set fullPath to true if the objectName
	// is the full path returned by a previous NewWriter call.
	NewWriter(ctx context.Context, objectName string, fullPath bool) (io.WriteCloser, string, error)

	NewReader(ctx context.Context, objectName string, fullPath bool) (io.ReadCloser, error)
}
