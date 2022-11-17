package requests

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/brist-ai/monoid/model"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/monoidprotocol/docker"
)

func (m *MonoidRequestHandler) HandleDeletion(request DeletionRequest) ([]*monoidprotocol.MonoidRecord, error) {
	records := []*monoidprotocol.MonoidRecord{}

	for _, siloDefinition := range request.SiloDefinitions {
		newRecords, err := m.deleteUserFromSilo(request.PrimaryKeyMap, siloDefinition)
		if err != nil {
			return nil, err
		}
		records = append(records, newRecords...)
	}
	return records, nil
}

func (m *MonoidRequestHandler) HandleQuery(request QueryRequest) ([]*monoidprotocol.MonoidRecord, error) {
	records := []*monoidprotocol.MonoidRecord{}

	for _, siloDefinition := range request.SiloDefinitions {
		newRecords, err := m.queryUserFromSilo(request.PrimaryKeyMap, siloDefinition)
		if err != nil {
			return nil, err
		}
		records = append(records, newRecords...)
	}
	return records, nil

}

func (m *MonoidRequestHandler) queryUserFromSilo(primaryKeyMap PrimaryKeyMap, siloDefinition model.SiloDefinition) ([]*monoidprotocol.MonoidRecord, error) {
	var primaryKey string
	var conf map[string]interface{}
	var records []*monoidprotocol.MonoidRecord

	protocol, err := docker.NewDockerMP(siloDefinition.SiloSpecification.DockerImage, siloDefinition.SiloSpecification.DockerTag)

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return nil, err
	}

	sch, err := protocol.Schema(context.Background(), conf)
	if err != nil {
		panic(err)
	}

	type SchemaKey struct {
		Name  string
		Group string
	}

	schemaMap := make(map[SchemaKey]*monoidprotocol.MonoidSchema)

	for _, schema := range sch.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}

		schemaKey := SchemaKey{
			Name:  schema.Name,
			Group: group,
		}

		schemaMap[schemaKey] = &schema

	}

	for _, dataSource := range siloDefinition.DataSources {
		primaryKey = ""
		for _, prop := range dataSource.Properties {
			if prop.UserPrimaryKeyID != nil {
				primaryKey = *prop.UserPrimaryKeyID
			}
		}
		if primaryKey == "" {
			continue
		}

		userKey, ok := primaryKeyMap[primaryKey]
		if !ok {
			return nil, errors.New("primary key type not defined")
		}

		group := ""
		if dataSource.Group != nil {
			group = *dataSource.Group
		}

		schemaKey := SchemaKey{
			Name:  dataSource.Name,
			Group: group,
		}

		recordChan, err := protocol.Query(context.Background(), conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{{
				SchemaName:      dataSource.Name,
				SchemaGroup:     dataSource.Group,
				JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schemaMap[schemaKey].JsonSchema),
				Identifier:      primaryKey,
				IdentifierQuery: userKey,
			}},
		})

		if err != nil {
			return nil, err
		}

		for record := range recordChan {
			r := record
			records = append(records, &r)
		}

	}

	return records, nil
}

func (m *MonoidRequestHandler) deleteUserFromSilo(primaryKeyMap PrimaryKeyMap, siloDefinition model.SiloDefinition) ([]*monoidprotocol.MonoidRecord, error) {
	var primaryKey string
	var conf map[string]interface{}
	var records []*monoidprotocol.MonoidRecord

	protocol, err := docker.NewDockerMP(siloDefinition.SiloSpecification.DockerImage, siloDefinition.SiloSpecification.DockerTag)

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(siloDefinition.Config), &conf); err != nil {
		return nil, err
	}

	sch, err := protocol.Schema(context.Background(), conf)
	if err != nil {
		panic(err)
	}

	type SchemaKey struct {
		Name  string
		Group string
	}

	schemaMap := make(map[SchemaKey]*monoidprotocol.MonoidSchema)

	for _, schema := range sch.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}

		schemaKey := SchemaKey{
			Name:  schema.Name,
			Group: group,
		}

		schemaMap[schemaKey] = &schema

	}

	for _, dataSource := range siloDefinition.DataSources {
		primaryKey = ""
		for _, prop := range dataSource.Properties {
			if prop.UserPrimaryKeyID != nil {
				primaryKey = *prop.UserPrimaryKeyID
			}
		}
		if primaryKey == "" {
			continue
		}

		userKey, ok := primaryKeyMap[primaryKey]
		if !ok {
			return nil, errors.New("primary key type not defined")
		}

		group := ""
		if dataSource.Group != nil {
			group = *dataSource.Group
		}

		schemaKey := SchemaKey{
			Name:  dataSource.Name,
			Group: group,
		}

		recordChan, err := protocol.Delete(context.Background(), conf, monoidprotocol.MonoidQuery{
			Identifiers: []monoidprotocol.MonoidQueryIdentifier{{
				SchemaName:      dataSource.Name,
				SchemaGroup:     dataSource.Group,
				JsonSchema:      monoidprotocol.MonoidQueryIdentifierJsonSchema(schemaMap[schemaKey].JsonSchema),
				Identifier:      primaryKey,
				IdentifierQuery: userKey,
			}},
		})

		if err != nil {
			return nil, err
		}

		for record := range recordChan {
			r := record
			records = append(records, &r)
		}

	}

	return records, nil
}

func NewMonoidRequestHandler() MonoidRequestHandler {
	return MonoidRequestHandler{}
}
