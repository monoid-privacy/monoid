package requests

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"os"
	"path/filepath"
	"strings"

	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/tartools"
	"github.com/rs/zerolog/log"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyz")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		b[i] = letters[j.Int64()]
	}
	return string(b)
}

func formatDataSourceName(
	ds model.DataSource,
) string {
	group := ""

	if ds.Group != nil {
		group = *ds.Group
		group += "-"
	}

	return strings.ReplaceAll(
		group+ds.Name,
		"/",
		"-",
	)
}

func generateSiloFile(
	conf *config.BaseConfig,
	tarWriter *tar.Writer,
	silo *model.SiloDefinition,
	statuses []*model.RequestStatus,
) error {
	baseName := silo.Name
	fileAdded := false

	for _, stat := range statuses {
		if stat.QueryResult == nil || stat.QueryResult.Records == nil {
			continue
		}

		dataSourceName := formatDataSourceName(stat.DataSource)
		records := *stat.QueryResult.Records

		fileAdded = true
		switch stat.QueryResult.ResultType {
		case model.ResultTypeFile:
			data := model.QueryResultFileData{}
			if err := json.Unmarshal([]byte(records), &data); err != nil {
				log.Err(err).Msg("Error decoding data")
				continue
			}

			f, err := os.Open(data.FilePath)
			if err != nil {
				log.Err(err).Msg("Error opening file")
				continue
			}

			defer f.Close()

			gz, err := gzip.NewReader(f)
			if err != nil {
				log.Err(err).Msg("Error parsing gzip")
				continue
			}

			defer gz.Close()

			tarReader := tar.NewReader(gz)

			if err := tartools.CopyFilesFromTar(tarWriter, baseName, tarReader); err != nil {
				log.Err(err).Msg("Error copying files")
				continue
			}
		case model.ResultTypeRecordsJSON:
			if err := tartools.AddFile(
				tarWriter,
				filepath.Join(baseName, fmt.Sprintf("%s.json", dataSourceName)),
				[]byte(records),
				0600,
			); err != nil {
				log.Err(err).Msg("Error writing file to tar")
				continue
			}
		}
	}

	if !fileAdded {
		if err := tartools.AddFile(
			tarWriter,
			filepath.Join(baseName, "no-data.txt"),
			[]byte("No data here."),
			0600,
		); err != nil {
			log.Err(err).Msg("Error writing file to tar")
		}
	}

	return nil
}

func generateTempRequestTar(conf *config.BaseConfig, requestID string) (string, error) {
	request := model.Request{}
	dataSilos := []*model.SiloDefinition{}

	if err := conf.DB.Preload("RequestStatuses").Preload(
		"RequestStatuses.QueryResult",
	).Preload(
		"RequestStatuses.DataSource",
	).Where(
		"id = ?",
		requestID,
	).First(&request).Error; err != nil {
		return "", err
	}

	if err := conf.DB.Where(
		"workspace_id = ?", request.WorkspaceID,
	).Find(&dataSilos).Error; err != nil {
		return "", err
	}

	out, err := os.CreateTemp(
		filepath.Join(conf.TempStorePath),
		fmt.Sprintf("%s*.tar.gz", requestID),
	)

	if err != nil {
		return "", err
	}

	defer out.Close()

	gw := gzip.NewWriter(out)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	statusMap := map[string][]*model.RequestStatus{}
	siloMap := map[string]*model.SiloDefinition{}

	for _, silo := range dataSilos {
		siloMap[silo.ID] = silo
		statusMap[silo.ID] = []*model.RequestStatus{}
	}

	for _, stat := range request.RequestStatuses {
		stat := stat

		if _, ok := statusMap[stat.DataSource.SiloDefinitionID]; !ok {
			log.Warn().Msgf("Did not find silo definition %s", stat.DataSource.SiloDefinitionID)
			continue
		}

		statusMap[stat.DataSource.SiloDefinitionID] = append(
			statusMap[stat.DataSource.SiloDefinitionID],
			&stat,
		)
	}

	for sid, statuses := range statusMap {
		silo, ok := siloMap[sid]
		if !ok {
			continue
		}

		if err := generateSiloFile(conf, tw, silo, statuses); err != nil {
			log.Err(err).Msgf("Error generating file for silo %s", sid)
		}
	}

	return out.Name(), nil
}

func GenerateRequestTar(ctx context.Context, conf *config.BaseConfig, requestID string) (string, error) {
	tmpFile, err := generateTempRequestTar(conf, requestID)
	if err != nil {
		return "", err
	}

	defer os.Remove(tmpFile)

	reader, err := os.Open(tmpFile)
	if err != nil {
		return "", err
	}
	defer reader.Close()

	writer, filePath, err := conf.FileStore.NewWriter(
		ctx,
		requestID+"-"+randSeq(5)+".tar.gz",
		false,
	)

	if err != nil {
		return "", err
	}

	defer writer.Close()

	_, err = io.Copy(writer, reader)
	if err != nil {
		return "", err
	}

	return filePath, nil
}
