package scanner

import "github.com/monoid-privacy/monoid/monoidprotocol"

type RuleMatch struct {
	RuleName    string
	DisplayName string
	Confidence  string
	Identifier  string
	MatchedData []string
	MatchType   string
	SchemaName  string
	SchemaGroup *string
	LineCount   int
}

type SchemaRecordGroup struct {
	Schema  monoidprotocol.MonoidSchema
	Records []monoidprotocol.MonoidRecord
}

type ValuePath struct {
	Path []string
	Type string
}
