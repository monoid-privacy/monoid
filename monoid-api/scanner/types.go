package scanner

type ScanOpts struct {
	Limit       int
	MatchConfig *MatchConfig
}

type MatchConfig struct {
	RegexRules     []regexRule
	NameRules      []nameRule
	MultiNameRules []multiNameRule
	TokenRules     []tokenRule
	MinCount       int
}

type MatchLine struct {
	LineIndex int
	Line      string
}

type ruleMatch struct {
	RuleName    string
	DisplayName string
	Confidence  string
	Identifier  string
	MatchedData []string
	MatchType   string
	LineCount   int
}

type MatchFinder struct {
	// dims [# rules][# matches]
	MatchedValues [][]MatchLine
	TokenValues   [][]MatchLine
	Count         int
	matchConfig   *MatchConfig
}
