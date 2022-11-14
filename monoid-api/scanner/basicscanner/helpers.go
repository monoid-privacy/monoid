package basicscanner

import (
	"errors"
	"regexp"

	"github.com/brist-ai/monoid/monoidprotocol"
)

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func matchNameRule(name string, rules []nameRule) (nameRule, int) {
	for i, rule := range rules {
		if stringInSlice(name, rule.ColumnNames) {
			return rule, i
		}
	}
	return nameRule{}, -1
}

func anyMatches(rule tokenRule, values []string) bool {
	for _, value := range values {
		if rule.Tokens.Contains(value) {
			return true
		}
	}
	return false
}

// split on whitespace
var tokenizer = regexp.MustCompile(`\W+`)

// var space = regexp.MustCompile(`\s+`)

// filtering out e.g. postgres connection commands
var urlPassword = regexp.MustCompile(`((\/\/|%2F%2F)\S+(:|%3A))\S+(@|%40)`)

func unique(arr []string) []string {
	keys := make(map[string]bool)
	list := []string{}
	for _, entry := range arr {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}

func getValues[T any](key string, records []monoidprotocol.MonoidRecord) ([]T, error) {
	values := []T{}
	for _, record := range records {
		value, ok := record.Data[key]
		if !ok {
			return nil, errors.New("monoid record missing key present in schema")
		}
		valueParsed, ok := value.(T)
		if !ok {
			return nil, errors.New("could not parse data as schema type")
		}
		values = append(values, valueParsed)
	}
	return values, nil
}
