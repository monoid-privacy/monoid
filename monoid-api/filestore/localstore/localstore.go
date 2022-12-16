package localstore

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"

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

func safeJoin(root string, objName string) string {
	if strings.HasPrefix(objName, root+string(os.PathSeparator)) {
		return objName
	}

	return filepath.Join(root, objName)
}

func (ls *localFileStore) NewWriter(ctx context.Context, objectName string, segmentFile bool) (io.WriteCloser, string, error) {
	fp := filepath.Join(ls.RootDir, objectName)
	f, err := os.Create(fp)

	if err != nil {
		return nil, "", err
	}

	return f, objectName, nil
}

func (ls *localFileStore) NewReader(ctx context.Context, objectName string, segmentFile bool) (io.ReadCloser, error) {
	fp := safeJoin(ls.RootDir, objectName)

	f, err := os.Open(fp)

	if err != nil {
		return nil, err
	}

	return f, nil
}
