package resolver

import (
	"fmt"

	"github.com/monoid-privacy/monoid/model"
	"github.com/monoid-privacy/monoid/monoidprotocol"
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"gorm.io/gorm"
)

const (
	Delete = "delete"
	Query  = "query"
)

func handleError(err error, msg string) *gqlerror.Error {
	log.Err(err).Msg(msg)
	return gqlerror.Errorf(msg)
}

func findChildObjects[childObjectType any](db *gorm.DB, parentObjectID string, queryId string) ([]*childObjectType, error) {
	childObjects := []*childObjectType{}
	queryString := fmt.Sprintf("%s = ?", queryId)
	if err := db.Where(queryString, parentObjectID).Find(&childObjects).Error; err != nil {
		return nil, err
	}

	return childObjects, nil
}

func findAllObjects[Object any](db *gorm.DB, errMsg string) ([]*Object, error) {
	objects := []*Object{}

	if err := db.Find(&objects).Error; err != nil {
		return nil, handleError(err, errMsg)
	}

	return objects, nil
}

func findObjectByID[Object any](id string, db *gorm.DB, errMsg string) (*Object, error) {
	var object Object

	if err := db.Where("id = ?", id).First(&object).Error; err != nil {
		return nil, handleError(err, errMsg)
	}

	return &object, nil
}

func DeleteObjectByID[Object any](id string, db *gorm.DB, errMsg string) (*string, error) {
	var object Object

	if err := db.Delete(&object, id).Error; err != nil {
		return nil, handleError(err, errMsg)
	}

	return &id, nil
}

func MonoidRecordsToMonoidRecordResponses(monoidRecords []monoidprotocol.MonoidRecord) []model.MonoidRecordResponse {
	var recordResponses []model.MonoidRecordResponse

	for _, record := range monoidRecords {
		response := MonoidRecordToMonoidRecordResponse(record)
		recordResponses = append(recordResponses, response)
	}

	return recordResponses
}

func MonoidRecordToMonoidRecordResponse(monoidRecord monoidprotocol.MonoidRecord) model.MonoidRecordResponse {
	dataString := fmt.Sprint(monoidRecord.Data)

	recordResponse := model.MonoidRecordResponse{
		Data:        dataString,
		SchemaGroup: monoidRecord.SchemaGroup,
		SchemaName:  monoidRecord.SchemaName,
	}

	return recordResponse
}
