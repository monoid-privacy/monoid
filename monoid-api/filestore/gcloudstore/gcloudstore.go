package gcloudstore

import (
	"context"
	"fmt"
	"io"
	"time"

	"cloud.google.com/go/storage"
	"github.com/monoid-privacy/monoid/filestore"
	"github.com/monoid-privacy/monoid/filestore/segwriter"
	"github.com/rs/zerolog/log"
	"google.golang.org/api/iterator"
)

type googleCloudStore struct {
	client *storage.Client
	bucket string
}

func NewGoogleCloudStore(client *storage.Client, bucket string) filestore.FileStore {
	return &googleCloudStore{
		client: client,
		bucket: bucket,
	}
}

func (ls *googleCloudStore) NewWriter(
	ctx context.Context,
	objectName string,
	segmentFile bool,
) (io.WriteCloser, string, error) {
	if !segmentFile {
		wr := ls.client.Bucket(ls.bucket).Object(objectName).NewWriter(ctx)
		return wr, objectName, nil
	}

	sw := segwriter.NewSegmentedWriter(func(i int) io.WriteCloser {
		wr := ls.client.Bucket(ls.bucket).Object(fmt.Sprintf("%s/%06d", objectName, i)).NewWriter(ctx)
		return wr
	}, 1*time.Minute)

	return sw, objectName, nil
}

func (ls *googleCloudStore) NewReader(
	ctx context.Context,
	objectName string,
	segmentFile bool,
) (io.ReadCloser, error) {
	if !segmentFile {
		r, err := ls.client.Bucket(ls.bucket).Object(objectName).NewReader(ctx)
		if err != nil {
			return nil, err
		}

		return r, err
	}

	iter := ls.client.Bucket(ls.bucket).Objects(ctx, &storage.Query{
		Prefix: objectName,
	})

	r, w := io.Pipe()
	go func() {
		defer w.Close()

		for {
			obj, err := iter.Next()

			if err == iterator.Done {
				break
			}

			if err != nil {
				log.Err(err).Msg("Error getting object")
				return
			}

			objReader, err := ls.client.Bucket(obj.Bucket).Object(obj.Name).NewReader(ctx)
			if err != nil {
				log.Err(err).Msg("Error creating reader")
				return
			}

			defer objReader.Close()

			if _, err := io.Copy(w, objReader); err != nil {
				log.Err(err).Msg("Error copying")
			}
		}
	}()

	return r, nil
}
