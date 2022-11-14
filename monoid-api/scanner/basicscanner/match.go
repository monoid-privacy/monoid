package basicscanner

import (
	"strings"

	"github.com/brist-ai/monoid/scanner"
)

// make matchfinder an interface with its own config

func NewMatchConfig() MatchConfig {
	return MatchConfig{
		RegexRules:     regexRules,
		NameRules:      nameRules,
		MultiNameRules: multiNameRules,
		TokenRules:     tokenRules,
		MinCount:       1,
	}
}

func (a *MatchFinder) Clear() {
	a.MatchedValues = make([][]MatchLine, len(a.matchConfig.RegexRules))
	a.TokenValues = make([][]MatchLine, len(a.matchConfig.TokenRules))
	a.Count = 0
}

func NewMatchFinder(matchConfig *MatchConfig) MatchFinder {
	return MatchFinder{
		make([][]MatchLine, len(matchConfig.RegexRules)),
		make([][]MatchLine, len(matchConfig.TokenRules)),
		make([][]MatchLine, len(matchConfig.NameRules)),
		0,
		matchConfig,
	}
}

func (m *MatchFinder) CheckMatches(colIdentifier string, schemaName string, schemaGroup *string) []scanner.RuleMatch {
	// TODO: handle onlyvalues?
	matchList := []scanner.RuleMatch{}

	matchedValues := m.MatchedValues
	count := m.Count

	for i, rule := range m.matchConfig.RegexRules {
		matchedData := []string{}
		for _, v := range matchedValues[i] {
			matchedData = append(matchedData, v.Line)
		}

		if rule.Name == "email" {
			// filter out false positives with URL credentials
			newMatchedData := matchedData
			matchedData = []string{}
			for _, v := range newMatchedData {
				v2 := urlPassword.ReplaceAllString(v, "[FILTERED]")
				if rule.Regex.MatchString(v2) {
					matchedData = append(matchedData, v)
				}
			}
		}

		if len(matchedData) >= m.matchConfig.MinCount {
			confidence := rule.Confidence

			if confidence == "" {
				if float64(len(matchedData))/float64(count) > 0.5 {
					confidence = "high"
				} else {
					confidence = "low"
				}
			}
			lineCount := len(matchedData)

			matchList = append(matchList, scanner.RuleMatch{SchemaName: schemaName, SchemaGroup: schemaGroup, RuleName: rule.Name, DisplayName: rule.DisplayName, Confidence: confidence, Identifier: colIdentifier, MatchedData: matchedData, LineCount: lineCount, MatchType: "value"})

		}

	}

	for i, rule := range m.matchConfig.TokenRules {
		matchedData := []string{}
		for _, v := range m.TokenValues[i] {
			matchedData = append(matchedData, v.Line)
		}

		if len(matchedData) >= m.matchConfig.MinCount {
			confidence := "low"
			if float64(len(matchedData))/float64(count) > 0.1 && len(unique(matchedData)) >= 10 {
				confidence = "high"
			}

			lineCount := len(matchedData)
			matchList = append(matchList, scanner.RuleMatch{
				RuleName:    rule.Name,
				DisplayName: rule.DisplayName,
				Confidence:  confidence,
				Identifier:  colIdentifier,
				MatchedData: matchedData,
				LineCount:   lineCount,
				MatchType:   "value",
			})
		}
	}

	return matchList
}

func pathToString(path []string) string {
	return strings.Join(path[:], ".")
}

func (m *MatchFinder) ScanString(v string, path []string) {
	for i, rule := range m.matchConfig.RegexRules {
		if rule.Regex.MatchString(v) {
			m.MatchedValues[i] = append(m.MatchedValues[i], MatchLine{Path: pathToString(path), Line: v})
		}
	}

	if len(m.matchConfig.TokenRules) > 0 {
		tokens := tokenizer.Split(strings.ToLower(v), -1)
		for i, rule := range m.matchConfig.TokenRules {
			if anyMatches(rule, tokens) {
				m.TokenValues[i] = append(m.TokenValues[i], MatchLine{Path: pathToString(path), Line: v})
			}
		}
	}

	m.Count++
}
