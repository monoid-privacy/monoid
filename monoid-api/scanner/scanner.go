package scanner

import (
	"context"
	"errors"
	"fmt"

	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/rs/zerolog/log"
)

type Scanner interface {
	Scan(monoidprotocol.MonoidRecord) error
	Summary() []RuleMatch
}

func ScanMonoidProtocol(ctx context.Context, config map[string]interface{}, monoidProtocol monoidprotocol.MonoidProtocol, scanner Scanner) ([]RuleMatch, error) {
	schemasMessage, err := monoidProtocol.Schema(ctx, config)
	if err != nil {
		return nil, HandleError(err, "Error scanning Monoid protocol.")
	}

	records, err := monoidProtocol.Sample(ctx, config, *schemasMessage)
	if err != nil {
		return nil, HandleError(err, "Error scanning Monoid protocol.")
	}

	ruleMatches := []RuleMatch{}

	type schemaMatcher struct {
		SchemaName  string
		SchemaGroup string
	}

	sampleMap := map[schemaMatcher]*SchemaRecordGroup{}

	for _, schema := range schemasMessage.Schemas {
		group := ""
		if schema.Group != nil {
			group = *schema.Group
		}
		schemaKey := schemaMatcher{
			SchemaName:  schema.Name,
			SchemaGroup: group,
		}
		sampleMap[schemaKey] = &SchemaRecordGroup{
			Schema:  schema,
			Records: []monoidprotocol.MonoidRecord{},
		}
	}

	for record := range records {
		group := ""
		if record.SchemaGroup != nil {
			group = *record.SchemaGroup
		}
		recordKey := schemaMatcher{
			SchemaName:  record.SchemaName,
			SchemaGroup: group,
		}

		if _, ok := sampleMap[recordKey]; ok {
			sampleMap[recordKey].Records = append(sampleMap[recordKey].Records, record)
		} else {
			return nil, HandleError(errors.New("record without matching schema"), "Error scanning Monoid protocol.")
		}

	}

	for _, _ = range sampleMap {
		// newMatches, err := scanner.ScanSchemaRecordGroup(*schemaRecordGroup)
		newMatches := []RuleMatch{}
		if err != nil {
			return nil, HandleError(err, "Error scanning Monoid protocol.")
		}
		ruleMatches = append(ruleMatches, newMatches...)
	}

	return ruleMatches, nil
}

func HandleError(err error, msg string) error {
	log.Err(err).Msg(msg)
	return fmt.Errorf(msg)
}
