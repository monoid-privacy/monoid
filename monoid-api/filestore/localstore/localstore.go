package localstore

import (
	"context"
	"io"
	"os"
	"path/filepath"

	"github.com/monoid-privacy/monoid/filestore"
)

type localFileStore struct {
	RootDir string
}

func NewLocalFileStore(rootDir string) filestore.FileStore {
	return &localFileStore{
		RootDir: rootDir,
	}
}

func (ls *localFileStore) NewWriter(ctx context.Context, objectName string, fullPath bool) (io.WriteCloser, string, error) {
	fp := objectName

	if !fullPath {
		fp = filepath.Join(ls.RootDir, objectName)
	}

	f, err := os.Create(fp)

	if err != nil {
		return nil, "", err
	}

	return f, fp, nil
}

func (ls *localFileStore) NewReader(ctx context.Context, objectName string, fullPath bool) (io.ReadCloser, error) {
	fp := objectName

	if !fullPath {
		fp = filepath.Join(ls.RootDir, objectName)
	}

	f, err := os.Open(fp)

	if err != nil {
		return nil, err
	}

	return f, nil
}
