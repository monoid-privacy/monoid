package scanner

import (
	"context"
	"errors"

	"github.com/brist-ai/monoid/monoidprotocol"
)

func scanMonoidProtocol(ctx context.Context, config map[string]interface{}, monoidProtocol monoidprotocol.MonoidProtocol, scanOpts ScanOpts) ([]ruleMatch, error) {
	schemasMessage, err := monoidProtocol.Schema(ctx, config)
	if err != nil {
		return nil, handleError(err, "Error scanning Monoid protocol.")
	}

	records, err := monoidProtocol.Sample(ctx, config, *schemasMessage)

	ruleMatches := []ruleMatch{}

	for record := range records {
		// TODO: better way to find the right schema given the record? Are we guaranteed an
		// ordering in the channel?
		for _, schema := range schemasMessage.Schemas {
			if schema.Name == record.SchemaName && schema.Group == record.SchemaGroup {
				if newMatches, err := scanMonoidRecord(schema.JsonSchema, record, scanOpts); err != nil {
					return nil, handleError(err, "Error scanning Monoid protocol.")
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
		return nil, handleError(errors.New("Schema incorrectly formatted."), "Error scanning Monoid record.")
	}

	propertiesMap, ok := properties.(map[string]interface{})
	if !ok {
		return nil, handleError(errors.New("Schema properties incorrectly formatted."), "Error scanning Monoid record.")
	}

	for k, v := range propertiesMap {
		data, ok := monoidRecord.Data[k]
		if !ok {
			return nil, handleError(errors.New("Monoid record missing key present in schema."), "Error scanning Monoid record.")
		}

		var newMatches []ruleMatch
		matchFinder := NewMatchFinder(scanOpts.MatchConfig)
		switch v {
		// TODO: Error handle the type conversion
		case "string":
			data, ok := data.([]string)
			if !ok {
				return nil, handleError(errors.New("Unable to convert data sample to array."), "Error scanning Monoid record.")
			}
			matchFinder.ScanValues(data)
			newMatches = matchFinder.CheckMatches(monoidRecord.SchemaName)
		default:
			return nil, handleError(errors.New("Unhandled type in schema."), "Error scanning Monoid record.")
		}

		// TODO: No match check
		// TODO: Add lat/long check

		ruleMatches = append(ruleMatches, newMatches...)
	}

	return ruleMatches, nil
}
