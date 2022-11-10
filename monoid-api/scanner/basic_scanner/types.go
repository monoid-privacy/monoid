package basic_scanner

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
	Path string
	Line string
}

type MatchFinder struct {
	// dims [# rules][# matches]
	MatchedValues [][]MatchLine
	TokenValues   [][]MatchLine
	NameValues    [][]MatchLine
	Count         int
	matchConfig   *MatchConfig
}
