package scanner

import (
	"fmt"
	"regexp"

	"github.com/rs/zerolog/log"
)

func HandleError(err error, msg string) error {
	log.Err(err).Msg(msg)
	return fmt.Errorf(msg)

}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func matchNameRule(name string, rules []nameRule) nameRule {
	for _, rule := range rules {
		if stringInSlice(name, rule.ColumnNames) {
			return rule
		}
	}
	return nameRule{}
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

var space = regexp.MustCompile(`\s+`)

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
