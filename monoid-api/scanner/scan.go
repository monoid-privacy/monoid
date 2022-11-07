package scanner

import (
	"context"
	"errors"

	"github.com/brist-ai/monoid/monoidprotocol"
)

func ScanMonoidProtocol(ctx context.Context, config map[string]interface{}, monoidProtocol monoidprotocol.MonoidProtocol, scanOpts ScanOpts) ([]ruleMatch, error) {
	schemasMessage, err := monoidProtocol.Schema(ctx, config)
	if err != nil {
		return nil, HandleError(err, "Error scanning Monoid protocol.")
	}

	records, err := monoidProtocol.Sample(ctx, config, *schemasMessage)
	if err != nil {
		return nil, HandleError(err, "Error scanning Monoid protocol.")
	}

	ruleMatches := []ruleMatch{}

	for record := range records {
		// TODO: better way to find the right schema given the record? Are we guaranteed an
		// ordering in the channel?
		// I'm only getting user records?
		for _, schema := range schemasMessage.Schemas {
			if schema.Name == record.SchemaName && *schema.Group == *record.SchemaGroup {
				if newMatches, err := scanMonoidRecord(schema.JsonSchema, record, scanOpts); err != nil {
					return nil, HandleError(err, "Error scanning Monoid protocol.")
				} else {
					ruleMatches = append(ruleMatches, newMatches...)
				}
			}
		}
	}

	return ruleMatches, nil
}

func scanMonoidRecord(schema map[string]interface{}, monoidRecord monoidprotocol.MonoidRecord, scanOpts ScanOpts) ([]ruleMatch, error) {
	var ruleMatches []ruleMatch

	properties, ok := schema["properties"]
	if !ok {
		return nil, HandleError(errors.New("Schema incorrectly formatted."), "Error scanning Monoid record.")
	}

	propertiesMap, ok := properties.(map[string]interface{})
	if !ok {
		return nil, HandleError(errors.New("Schema properties incorrectly formatted."), "Error scanning Monoid record.")
	}

	for k, v := range propertiesMap {
		data, ok := monoidRecord.Data[k]
		if !ok {
			return nil, HandleError(errors.New("Monoid record missing key present in schema."), "Error scanning Monoid record.")
		}

		mappedValue, ok := v.(map[string]interface{})
		if !ok {
			return nil, HandleError(errors.New("Monoid schema properties incorrectly formatted."), "Error scanning Monoid record.")
		}

		typeString, ok := mappedValue["type"]
		if !ok {
			return nil, HandleError(errors.New("Monoid schema properties incorrectly formatted."), "Error scanning Monoid record.")
		}

		var newMatches []ruleMatch
		matchFinder := NewMatchFinder(scanOpts.MatchConfig)
		switch typeString {
		// TODO: Error handle the type conversion
		case "string":
			data, ok := data.(string)
			if !ok {
				return nil, HandleError(errors.New("Unable to convert data sample to array."), "Error scanning Monoid record.")
			}
			matchFinder.ScanValues([]string{data})
			newMatches = matchFinder.CheckMatches(monoidRecord.SchemaName)
		case "integer":
			continue
		default:
			return nil, HandleError(errors.New("Unhandled type in schema."), "Error scanning Monoid record.")
		}

		// TODO: No match check
		// TODO: Add lat/long check

		ruleMatches = append(ruleMatches, newMatches...)
	}

	return ruleMatches, nil
}
