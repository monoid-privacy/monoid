package scanner

import "fmt"

type MonoidAdapter struct{}

func (m *MonoidAdapter) Scan(scanOpts ScanOpts) ([]ruleMatch, error) {
	return scanDataStore(m, scanOpts)
}

func (a *MonoidAdapter) Init(url string) error {
	panic(fmt.Errorf("not implemented: MonoidAdapter.Init"))
}

func (m *MonoidAdapter) FetchTables() ([]table, error) {
	panic(fmt.Errorf("not implemented: MonoidAdapter.FetchTables"))
}

func (a *MonoidAdapter) FetchTableData(table table, limit int) (*tableData, error) {
	panic(fmt.Errorf("not implemented: MonoidAdapter.FetchTableData"))
}
