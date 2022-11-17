package basicscanner

import (
	"errors"
	"strings"

	"github.com/brist-ai/monoid/jsonschema"
	"github.com/brist-ai/monoid/monoidprotocol"
	"github.com/brist-ai/monoid/scanner"
	"github.com/mitchellh/mapstructure"
)

type BasicScanner struct {
	SchemaName  string
	SchemaGroup string
	Schema      jsonschema.Schema
	ValuePaths  []scanner.ValuePath
	MatchConfig *MatchConfig
	MatchFinder MatchFinder
}

func NewBasicScanner(schema monoidprotocol.MonoidSchema) (*BasicScanner, error) {
	matchConfig := NewMatchConfig()

	parsedSchema := jsonschema.Schema{}
	if err := mapstructure.Decode(schema.JsonSchema, &parsedSchema); err != nil {
		return nil, err
	}

	valuePaths := getValuePaths(parsedSchema)

	schemaGroup := ""
	if schema.Group != nil {
		schemaGroup = *schema.Group
	}

	matchFinder := NewMatchFinder(&matchConfig)

	bs := BasicScanner{
		SchemaName:  schema.Name,
		SchemaGroup: schemaGroup,
		Schema:      parsedSchema,
		ValuePaths:  valuePaths,
		MatchFinder: matchFinder,
		MatchConfig: &matchConfig,
	}

	bs.ScanNames()

	return &bs, nil
}

func (r *BasicScanner) ScanNames() {
	for _, vp := range r.ValuePaths {
		colName := vp.Path[len(vp.Path)-1]
		name := strings.Replace(strings.ToLower(colName), "_", "", -1)

		_, index := matchNameRule(name, r.MatchConfig.NameRules)
		if index >= 0 {
			r.MatchFinder.NameValues[index] = append(r.MatchFinder.NameValues[index], MatchLine{Path: strings.Join(vp.Path, "."), Line: ""})
		}
	}
}

func getValuePathsHelper(schema *jsonschema.Schema, path []string, valuePaths []scanner.ValuePath) {
	if schema == nil {
		return
	}
	for propertyName, propertyValue := range schema.Properties {
		path = append(path, propertyName)
		if stringInSlice(propertyValue.Type, []string{"string", "number", "integer"}) {
			copiedPath := make([]string, len(path))
			copy(copiedPath, path)
			valuePaths = append(valuePaths, scanner.ValuePath{
				Path: copiedPath,
				Type: propertyValue.Type,
			})
		} else {
			if propertyValue != nil {
				getValuePathsHelper(propertyValue, path, valuePaths)
			}
		}
		path = path[:len(path)-1]
	}
}

func getValuePaths(schema jsonschema.Schema) []scanner.ValuePath {
	valuePaths := []scanner.ValuePath{}
	getValuePathsHelper(&schema, []string{}, valuePaths)
	return valuePaths
}

func getValueByPath(valuePath scanner.ValuePath, data monoidprotocol.MonoidRecordData) (string, error) {
	value, ok := data[valuePath.Path[0]]
	if !ok {
		return "", errors.New("property doesn't match path ")
	}
	if len(valuePath.Path) == 1 {
		valueString, ok := value.(string)
		if !ok {
			return "", errors.New("value has incorrect type ")
		}
		return valueString, nil
	}
	valueData, ok := value.(monoidprotocol.MonoidRecordData)
	if !ok {
		return "", errors.New("cannot parse value data into monoid data")
	}
	valueString, err := getValueByPath(scanner.ValuePath{
		Path: valuePath.Path[1:],
		Type: valuePath.Type,
	}, valueData)
	if err != nil {
		return "", err
	}
	return valueString, nil
}

func (r *BasicScanner) Scan(record *monoidprotocol.MonoidRecord) error {
	group := ""
	if record.SchemaGroup != nil {
		group = *record.SchemaGroup
	}
	if record.SchemaName != r.SchemaName || group != r.SchemaGroup {
		return errors.New("record not compatible with scanner's schema")
	}

	for _, valuePath := range r.ValuePaths {
		if valuePath.Type != "string" {
			continue
		}

		value, err := getValueByPath(valuePath, record.Data)
		if err != nil {
			return err
		}

		r.MatchFinder.ScanString(value, valuePath.Path)
	}
	// TODO: parse numbers as well

	return nil
}

func (r *BasicScanner) Summary() []scanner.RuleMatch {
	// Go through MatchFinder -- for each rule, group by paths, run checkmatches, and output rulematches
	ruleMatches := []scanner.RuleMatch{}

	for i, rule := range r.MatchConfig.RegexRules {
		pathMap := map[string][]MatchLine{}
		for _, v := range r.MatchFinder.MatchedValues[i] {
			if _, ok := pathMap[v.Path]; !ok {
				pathMap[v.Path] = []MatchLine{v}
			} else {
				pathMap[v.Path] = append(pathMap[v.Path], v)
			}
		}

		for path, matchedData := range pathMap {
			if len(matchedData) >= r.MatchConfig.MinCount {
				confidence := rule.Confidence

				if confidence == "" {
					confidence = "low"
				}

				lineCount := len(matchedData)

				stringMatchedData := []string{}

				for _, line := range matchedData {
					stringMatchedData = append(stringMatchedData, line.Line)
				}
				ruleMatches = append(ruleMatches, scanner.RuleMatch{
					SchemaName:  r.SchemaName,
					SchemaGroup: &r.SchemaGroup,
					RuleName:    rule.Name,
					DisplayName: rule.DisplayName,
					Confidence:  confidence,
					Identifier:  path,
					MatchedData: stringMatchedData,
					LineCount:   lineCount,
					MatchType:   "value",
				})

			}
		}
	}

	for i, rule := range r.MatchConfig.NameRules {
		paths := []string{}
		for _, lineMatch := range r.MatchFinder.NameValues[i] {
			paths = append(paths, lineMatch.Path)
		}
		if len(paths) > 0 {
			ruleMatches = append(ruleMatches, scanner.RuleMatch{
				RuleName:    rule.Name,
				DisplayName: rule.DisplayName,
				Confidence:  "medium",
				Identifier:  pathToString(paths),
				MatchedData: paths,
				MatchType:   "name",
			})
		}
	}

	return ruleMatches
}
