package tartools

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/rs/zerolog/log"
)

func WrapInTar(reader io.Reader, name string) (io.ReadCloser, error) {
	out, w := io.Pipe()

	go func() {
		defer w.Close()

		gw := gzip.NewWriter(w)
		defer gw.Close()

		tw := tar.NewWriter(gw)
		defer tw.Close()

		file, err := io.ReadAll(reader)
		if err != nil {
			return
		}

		if err := AddFile(tw, name, file, 0600); err != nil {
			return
		}
	}()

	return out, nil
}

func CopyFilesFromTar(tarWriter *tar.Writer, filePrefix string, src *tar.Reader) error {
	for {
		h, err := src.Next()
		if err == io.EOF {
			return nil
		}

		if err != nil {
			return err
		}

		h.Name = filepath.Join(filePrefix, h.Name)
		if err := tarWriter.WriteHeader(h); err != nil {
			return err
		}

		if _, err := io.Copy(tarWriter, src); err != nil {
			return err
		}
	}
}

func AddFile(tarWriter *tar.Writer, filePath string, fileContent []byte, mode int64) error {
	header := &tar.Header{
		Name: filePath,
		Mode: mode,
		Size: int64(len(fileContent)),
	}

	if err := tarWriter.WriteHeader(header); err != nil {
		return err
	}

	_, err := tarWriter.Write(fileContent)

	return err
}

func CopyTarToDir(tr *tar.Reader, dest string) error {
	for {
		header, err := tr.Next()

		switch {
		case err == io.EOF:
			return nil
		case err != nil:
			return err
		case header == nil:
			continue
		}

		headerPath := strings.Split(header.Name, string(os.PathSeparator))[1:]

		target := filepath.Join(append([]string{dest}, headerPath...)...)

		// check the file type
		switch header.Typeflag {
		case tar.TypeDir:
			// this is the root directory of the tar, so it doesn't need
			// creating
			if len(headerPath) == 0 {
				continue
			}

			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0755); err != nil {
					return err
				}
			}

		// if it's a file create it
		case tar.TypeReg:
			f, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				log.Err(err).Msg("Error opening file")
				continue
			}

			// copy over contents
			if _, err := io.Copy(f, tr); err != nil {
				log.Err(err).Msg("Error copying contents")
				continue
			}

			// manually close here after each file operation; defering would cause each file close
			// to wait until all operations have completed.
			f.Close()
		}
	}
}
