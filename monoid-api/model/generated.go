// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

type CreateCategoryInput struct {
	Name        string `json:"name"`
	WorkspaceID string `json:"workspaceID"`
}

type CreateDataSourceInput struct {
	SiloDefinitionID string   `json:"siloDefinitionID"`
	Description      *string  `json:"description"`
	Schema           string   `json:"schema"`
	PropertyIDs      []string `json:"propertyIDs"`
}

type CreatePropertyInput struct {
	CategoryIDs  []string `json:"categoryIDs"`
	DataSourceID string   `json:"dataSourceID"`
	PurposeIDs   []string `json:"purposeIDs"`
}

type CreatePurposeInput struct {
	Name        string `json:"name"`
	WorkspaceID string `json:"workspaceID"`
}

type CreateSiloDefinitionInput struct {
	Description         *string  `json:"description"`
	SiloSpecificationID string   `json:"siloSpecificationID"`
	WorkspaceID         string   `json:"workspaceID"`
	SubjectIDs          []string `json:"subjectIDs"`
	SiloData            *string  `json:"siloData"`
	Name                string   `json:"name"`
}

type CreateSiloSpecificationInput struct {
	Name        string  `json:"name"`
	WorkspaceID string  `json:"workspaceID"`
	LogoURL     *string `json:"logoURL"`
	DockerImage string  `json:"dockerImage"`
	Schema      *string `json:"schema"`
}

type CreateSubjectInput struct {
	Name        string `json:"name"`
	WorkspaceID string `json:"workspaceID"`
}

type CreateWorkspaceInput struct {
	Name     string    `json:"name"`
	Settings []*KVPair `json:"settings"`
}

type KVPair struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UpdateCategoryInput struct {
	Name *string `json:"name"`
}

type UpdateDataSourceInput struct {
	ID          string  `json:"id"`
	Description *string `json:"description"`
	Schema      *string `json:"schema"`
}

type UpdatePropertyInput struct {
	ID          string   `json:"id"`
	CategoryIDs []string `json:"categoryIDs"`
	PurposeIDs  []string `json:"purposeIDs"`
}

type UpdatePurposeInput struct {
	Name *string `json:"name"`
}

type UpdateSiloDefinitionInput struct {
	ID          string   `json:"id"`
	WorkspaceID string   `json:"workspaceId"`
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	SubjectIDs  []string `json:"subjectIDs"`
	SiloData    *string  `json:"siloData"`
}

type UpdateSiloSpecificationInput struct {
	ID          string  `json:"id"`
	DockerImage *string `json:"dockerImage"`
	Schema      *string `json:"schema"`
	Name        *string `json:"name"`
	LogoURL     *string `json:"logoUrl"`
}

type UpdateSubjectInput struct {
	Name *string `json:"name"`
}
