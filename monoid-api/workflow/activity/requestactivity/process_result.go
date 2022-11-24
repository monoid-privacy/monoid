package requestactivity

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
	"github.com/google/uuid"
	"go.temporal.io/sdk/activity"
)

type ProcessRequestArgs struct {
	ProtocolRequestStatus monoidprotocol.MonoidRequestStatus
	RequestStatusID       string
}

func (a *RequestActivity) ProcessRequestResults(
	ctx context.Context,
	args ProcessRequestArgs,
) error {
	logger := activity.GetLogger(ctx)

	if args.ProtocolRequestStatus.RequestStatus != monoidprotocol.MonoidRequestStatusRequestStatusCOMPLETE {
		return fmt.Errorf("request can only be read when the status is complete")
	}

	dataType := args.ProtocolRequestStatus.DataType
	if dataType == nil || *dataType == monoidprotocol.MonoidRequestStatusDataTypeNONE {
		return nil
	}

	requestStatus := model.RequestStatus{}

	if err := a.Conf.DB.Model(model.RequestStatus{}).
		Preload("DataSource").
		Preload("DataSource.SiloDefinition").
		Preload("DataSource.SiloDefinition.SiloSpecification").
		Preload("Request").
		Where("id = ?", args.RequestStatusID).First(&requestStatus).Error; err != nil {
		return err
	}

	siloDef := requestStatus.DataSource.SiloDefinition
	siloSpec := siloDef.SiloSpecification

	conf := map[string]interface{}{}
	if err := json.Unmarshal([]byte(siloDef.Config), &conf); err != nil {
		return err
	}

	handle := monoidprotocol.MonoidRequestHandle{}
	if err := json.Unmarshal([]byte(requestStatus.RequestHandle), &handle); err != nil {
		return err
	}

	// Create a temporary directory that can be used by the docker container
	dir, err := ioutil.TempDir("/tmp/monoid", "monoid")
	if err != nil {
		return err
	}

	defer os.RemoveAll(dir)

	// Start the docker protocol
	protocol, err := docker.NewDockerMP(siloSpec.DockerImage, siloSpec.DockerTag, dir)
	if err != nil {
		return err
	}

	defer protocol.Teardown(ctx)

	logChan, err := protocol.AttachLogs(ctx)
	if err != nil {
		return err
	}

	go func() {
		for l := range logChan {
			logger.Debug(l.Message)
		}
	}()

	recordCh, err := protocol.RequestResults(ctx, conf, monoidprotocol.MonoidRequestsMessage{
		Handles: []monoidprotocol.MonoidRequestHandle{handle},
	})

	var res any
	var resultType model.ResultType

	switch *dataType {
	case monoidprotocol.MonoidRequestStatusDataTypeFILE:
		resultType = model.ResultTypeFile

		var file *monoidprotocol.MonoidRecord
		for record := range recordCh {
			if file != nil {
				logger.Warn("This invocation should only return one file path")
			}

			record := record
			file = &record
		}

		if file.File == nil {
			return fmt.Errorf("file must be non-nil if data type is file")
		}

		res = map[string]interface{}{
			"filePath": *file.File,
		}

	case monoidprotocol.MonoidRequestStatusDataTypeRECORDS:
		resultType = model.ResultTypeRecordsJSON

		// Read the return data
		records := []*monoidprotocol.MonoidRecordData{}

		for record := range recordCh {
			logger.Debug("Read from channel")
			records = append(records, &record.Data)
		}

		logger.Debug("Done from channel")

		res = records
	}

	// Write the records back to the db
	if requestStatus.Request.Type == model.UserDataRequestTypeQuery {
		records, err := json.Marshal(res)
		if err != nil {
			return err
		}

		r := model.SecretString(records)

		if err = a.Conf.DB.Create(&model.QueryResult{
			ID:              uuid.NewString(),
			RequestStatusID: requestStatus.ID,
			Records:         &r,
			ResultType:      resultType,
		}).Error; err != nil {
			return err
		}
	}

	return nil
}
