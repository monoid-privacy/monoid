package scanner

import (
	"fmt"

	"github.com/brist-ai/monoid/monoidprotocol"
)

type MonoidAdapter struct {
	monoidProtocol *monoidprotocol.MonoidProtocol
}

func (m *MonoidAdapter) Scan(scanOpts ScanOpts) ([]ruleMatch, error) {
	return scanDataStore(m, scanOpts)
}

func (a *MonoidAdapter) Init(spec *monoidprotocol.MonoidProtocol) error {
	a.monoidProtocol = spec
	return nil
}

func (m *MonoidAdapter) FetchTables() ([]table, error) {
	panic(fmt.Errorf("not implemented: MonoidAdapter.FetchTables"))
}

func (a *MonoidAdapter) FetchTableData(table table, limit int) (*tableData, error) {
	panic(fmt.Errorf("not implemented: MonoidAdapter.FetchTableData"))
}
