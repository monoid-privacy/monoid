package localstore

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"io"

	"github.com/minio/sio"
	"github.com/monoid-privacy/monoid/filestore"
	"golang.org/x/crypto/hkdf"
)

type encryptedFileStore struct {
	filestore filestore.FileStore
	key       []byte
}

func NewEncryptedFileStore(filestore filestore.FileStore, key []byte) filestore.FileStore {
	return &encryptedFileStore{
		filestore: filestore,
		key:       key,
	}
}

func (fs *encryptedFileStore) NewWriter(
	ctx context.Context,
	objectName string,
	segmentFile bool,
) (wr io.WriteCloser, fp string, err error) {
	writer, filePath, err := fs.filestore.NewWriter(ctx, objectName, segmentFile)
	if err != nil {
		return nil, "", err
	}

	defer func() {
		if err != nil {
			wr.Close()
			fp = ""
			wr = nil
		}
	}()

	var nonce [32]byte
	if _, err = io.ReadFull(rand.Reader, nonce[:]); err != nil {
		return nil, "", err
	}

	var key [32]byte
	kdf := hkdf.New(sha256.New, key[:], nonce[:], nil)
	if _, err = io.ReadFull(kdf, key[:]); err != nil {
		return nil, "", err
	}

	writer, err = sio.EncryptWriter(writer, sio.Config{Key: key[:]})
	if err != nil {
		return nil, "", err
	}

	return writer, filePath, nil
}

func (ls *encryptedFileStore) NewReader(ctx context.Context, objectName string, segmentFile bool) (io.ReadCloser, error) {
	return ls.filestore.NewReader(ctx, objectName, segmentFile)
}
