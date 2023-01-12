package requestactivity

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	monoidactivity "github.com/monoid-privacy/monoid/workflow/activity"
	"go.temporal.io/sdk/activity"
)

type ProcessRequestArgs struct {
	ProtocolRequestStatus []monoidprotocol.MonoidRequestStatus
	RequestStatusIDs      []string
}

type ProcessRequestItem struct {
	Error           *RequestStatusError
	RequestStatusID string
}

type ProcessRequestResult struct {
	ResultItems []ProcessRequestItem
}

func copyMap[M map[string]interface{} | monoidprotocol.MonoidRecordData](m M) M {
	newMap := M{}
	for k, v := range m {
		switch v := v.(type) {
		case M:
			newMap[k] = copyMap(v)
		default:
			newMap[k] = v
		}
	}

	return newMap
}

func (a *RequestActivity) copyTarGzToStorage(
	ctx context.Context,
	sourcePath string,
) (string, error) {
	wr, fp, err := a.Conf.FileStore.NewWriter(ctx, uuid.NewString(), false)

	if err != nil {
		return "", err
	}

	defer wr.Close()

	fileReader, err := os.Open(sourcePath)
	if err != nil {
		return "", err
	}

	defer fileReader.Close()

	gz, err := gzip.NewReader(fileReader)
	if err != nil {
		return "", fmt.Errorf("file must be gzipped tar")
	}

	defer gz.Close()

	tr := tar.NewReader(gz)
	_, err = tr.Next()
	if err != nil {
		return "", fmt.Errorf("file must be gzipped tar")
	}

	_, err = fileReader.Seek(0, io.SeekStart)
	if err != nil {
		return "", err
	}

	_, err = io.Copy(wr, fileReader)
	if err != nil {
		return "", err
	}

	return fp, nil
}

func (a *RequestActivity) ProcessRequestResults(
	ctx context.Context,
	args ProcessRequestArgs,
) (ProcessRequestResult, error) {
	logger := activity.GetLogger(ctx)
	resultMap := map[string]ProcessRequestItem{}
	requestStatuses := []*model.RequestStatus{}
	protocolStatusMap := map[monoidactivity.DataSourceMatcher]monoidprotocol.MonoidRequestStatus{}
	matcherRequestStatusMap := map[monoidactivity.DataSourceMatcher]model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("Request").
		Where("id IN ?", args.RequestStatusIDs).Find(&requestStatuses).Error; err != nil {
		return ProcessRequestResult{}, err
	}

	for _, prs := range args.ProtocolRequestStatus {
		protocolStatusMap[monoidactivity.NewDataSourceMatcher(
			prs.SchemaName,
			prs.SchemaGroup,
		)] = prs
	}

	var siloDef *model.SiloDefinition
	var request *model.Request

	handles := make([]monoidprotocol.MonoidRequestHandle, 0, len(requestStatuses))

	for _, rs := range requestStatuses {

		dsm := monoidactivity.NewDataSourceMatcher(
			rs.DataSource.Name,
			rs.DataSource.Group,
		)
		prstat, ok := protocolStatusMap[dsm]

		requestSilo := rs.DataSource.SiloDefinition
		if siloDef != nil && siloDef.ID != requestSilo.ID {
			return ProcessRequestResult{}, fmt.Errorf("all requests must be for the same silo")
		} else if siloDef == nil {
			siloDef = &requestSilo
		}

		rsRequest := rs.Request
		if request != nil && request.ID != rsRequest.ID {
			return ProcessRequestResult{}, fmt.Errorf("all requests must be for the same request")
		} else if request == nil {
			request = &rsRequest
		}

		if !ok {
			resultMap[rs.ID] = ProcessRequestItem{
				Error: &RequestStatusError{Message: "request status not provided"},
			}

			continue
		}

		if prstat.RequestStatus != monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE {
			resultMap[rs.ID] = ProcessRequestItem{
				Error: &RequestStatusError{Message: "request can only be read when the status is complete"},
			}

			continue
		}

		dataType := prstat.DataType
		if dataType == nil || *dataType == monoidprotocol.MonoidRequestStatusDataTypeNONE {
			resultMap[rs.ID] = ProcessRequestItem{}
			continue
		}

		handle := monoidprotocol.MonoidRequestHandle{}
		if err := json.Unmarshal([]byte(rs.RequestHandle), &handle); err != nil {
			resultMap[rs.ID] = ProcessRequestItem{
				Error: &RequestStatusError{Message: err.Error()},
			}
		}

		handles = append(handles, handle)
		matcherRequestStatusMap[dsm] = *rs
	}

	if siloDef == nil {
		return ProcessRequestResult{}, nil
	}

	if len(handles) > 0 {
		siloSpec := siloDef.SiloSpecification

		conf := map[string]interface{}{}
		if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
			return ProcessRequestResult{}, err
		}

		// Create a temporary directory that can be used by the docker container
		dir, err := ioutil.TempDir(a.Conf.TempStorePath, "monoid")
		if err != nil {
			return ProcessRequestResult{}, err
		}

		defer os.RemoveAll(dir)

		// Start the docker protocol
		protocol, err := a.Conf.ProtocolFactory.NewMonoidProtocol(
			siloSpec.DockerImage, siloSpec.DockerTag, dir,
		)
		if err != nil {
			return ProcessRequestResult{}, err
		}

		defer protocol.Teardown(ctx)

		if err := protocol.InitConn(ctx); err != nil {
			return ProcessRequestResult{}, err
		}

		logChan, err := protocol.AttachLogs(ctx)
		if err != nil {
			return ProcessRequestResult{}, err
		}

		go func() {
			for l := range logChan {
				logger.Info("container-log", "log", l.Message)
			}
		}()

		var wg sync.WaitGroup
		var fileWg sync.WaitGroup
		var resultMutex sync.Mutex

		recordCh, completeCh, err := protocol.RequestResults(ctx, conf, monoidprotocol.MonoidRequestsMessage{
			Handles: handles,
		})

		if err != nil {
			return ProcessRequestResult{}, err
		}

		wg.Add(1)

		result := int64(0)

		go func() {
			result = <-completeCh
			wg.Done()
		}()

		type queryResult struct {
			resultType model.ResultType
			data       any
		}

		queryResults := map[string]*queryResult{}

		for record := range recordCh {
			dsm := monoidactivity.NewDataSourceMatcher(
				record.SchemaName,
				record.SchemaGroup,
			)

			rs, ok := matcherRequestStatusMap[dsm]

			if !ok {
				logger.Warn("Unknown data source found", record.SchemaName, record.SchemaGroup)
				continue
			}

			prs, ok := protocolStatusMap[dsm]
			if !ok {
				logger.Warn("Unknown data source found", record.SchemaName, record.SchemaGroup)
				continue
			}

			dataType := prs.DataType
			switch *dataType {
			case monoidprotocol.MonoidRequestStatusDataTypeFILE:
				fileWg.Add(1)
				go func(record monoidprotocol.MonoidRecord) {
					defer fileWg.Done()

					wg.Wait()

					if result != 0 {
						return
					}

					resultMutex.Lock()
					defer resultMutex.Unlock()

					_, ok := queryResults[rs.ID]
					if !ok {
						queryResults[rs.ID] = &queryResult{
							resultType: model.ResultTypeFile,
							data:       model.QueryResultFileData{},
						}
					}

					_, dok := queryResults[rs.ID].data.(model.QueryResultFileData)
					if !dok {
						logger.Warn("Error casting existing data")
						return
					}

					if dok && ok {
						logger.Warn("File data results should only be one file path, got multiple.")
					}

					if record.File == nil {
						logger.Warn("File attr must not be nil")
						return
					}

					f := filepath.Join(dir, *record.File)

					fp, err := a.copyTarGzToStorage(ctx, f)
					if err != nil {
						logger.Error("Error copying file", err)
					}

					queryResults[rs.ID].data = model.QueryResultFileData{
						FilePath: fp,
					}
				}(record)
			case monoidprotocol.MonoidRequestStatusDataTypeRECORDS:
				resultMutex.Lock()

				_, ok := queryResults[rs.ID]
				if !ok {
					queryResults[rs.ID] = &queryResult{
						resultType: model.ResultTypeRecordsJSON,
						data:       []*monoidprotocol.MonoidRecordData{},
					}
				}

				data, ok := queryResults[rs.ID].data.([]*monoidprotocol.MonoidRecordData)
				if !ok {
					logger.Warn("Error casting existing data")
					resultMutex.Unlock()
					continue
				}

				copiedData := copyMap(record.Data)
				queryResults[rs.ID].data = append(data, &copiedData)

				resultMutex.Unlock()
			}
		}

		fileWg.Wait()
		wg.Wait()

		if result != 0 {
			return ProcessRequestResult{}, fmt.Errorf("container exited with non-zero code (%d)", result)
		}

		// Write the records back to the db
		for rsID, qr := range queryResults {
			if request.Type == model.UserDataRequestTypeQuery {
				records, err := json.Marshal(qr.data)
				if err != nil {
					resultMap[rsID] = ProcessRequestItem{Error: &RequestStatusError{
						Message: err.Error(),
					}}

					continue
				}

				r := model.SecretString(records)

				if err = a.Conf.DB.Create(&model.QueryResult{
					ID:              uuid.NewString(),
					RequestStatusID: rsID,
					Records:         &r,
					ResultType:      qr.resultType,
				}).Error; err != nil {
					resultMap[rsID] = ProcessRequestItem{Error: &RequestStatusError{
						Message: err.Error(),
					}}

					continue
				}
			}

			resultMap[rsID] = ProcessRequestItem{}
		}
	}

	results := make([]ProcessRequestItem, len(args.RequestStatusIDs))

	// Add all the results back to the map
	for i, s := range args.RequestStatusIDs {
		res, ok := resultMap[s]
		if !ok {
			// This means that the protocol returned no records, so there's no data in this
			// data source for the request.
			res = ProcessRequestItem{
				RequestStatusID: s,
			}
		}

		res.RequestStatusID = s
		results[i] = res
	}

	return ProcessRequestResult{ResultItems: results}, nil
}
