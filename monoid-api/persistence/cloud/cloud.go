package cloud

import (
	"github.com/brist-ai/monoid/persistence"
	"github.com/brist-ai/monoid/persistence/database"
	"gorm.io/gorm"
)

type CloudDBPersistence struct {
	DB *gorm.DB
}

func (p *CloudDBPersistence) stdPersistenceDB(db *gorm.DB) persistence.Persistence {
	return &database.DBPersistence{
		DB: db,
	}
}

func (p *CloudDBPersistence) standardPersistence() persistence.Persistence {
	return &database.DBPersistence{
		DB: p.DB,
	}
}
