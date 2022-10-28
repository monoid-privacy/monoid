package database

import (
	"gorm.io/gorm"
)

type DBPersistence struct {
	DB *gorm.DB
}
