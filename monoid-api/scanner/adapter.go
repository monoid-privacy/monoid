package scanner

type table struct {
	Schema string
	Name   string
}

type Adapter interface {
	Init(url string) error
	FetchTables() ([]table, error)
	FetchTableData(object table, limit int) (*tableData, error)
	Scan(scanOpts ScanOpts) ([]ruleMatch, error)
}

func (t table) displayName() string {
	str := t.Name
	if t.Schema != "" {
		str = t.Schema + "." + str
	}
	return str
}

type ScanOpts struct {
	UrlStr      string
	ShowData    bool
	ShowAll     bool
	Limit       int
	Debug       bool
	MatchConfig *MatchConfig
}
