package resolver

import (
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"gorm.io/gorm"
)

func handleError(err error, msg string) *gqlerror.Error {
	log.Err(err).Msg(msg)
	return gqlerror.Errorf(msg)

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

func str(s string) *string {
	return &s
}
