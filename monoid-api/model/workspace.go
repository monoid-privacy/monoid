package model

import (
	"regexp"

	"gorm.io/datatypes"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type Workspace struct {
	ID                 string
	Name               string
	OnboardingComplete bool `default:"false"`
	SiloSpecifications []SiloSpecification
	SiloDefinitions    []SiloDefinition
	Subjects           []Subject
	Purposes           []Purpose
	Categories         []Category
	Requests           []Request
	UserPrimaryKey     []UserPrimaryKey
	Settings           datatypes.JSON
}

type WorkspaceSettings struct {
	Email         string `json:"email"`
	SendNews      bool   `json:"sendNews"`
	AnonymizeData bool   `json:"anonymizeData"`
}

func ValidateEmail(email string) bool {
	return len(email) > 0 && emailRegex.MatchString(email)
}
