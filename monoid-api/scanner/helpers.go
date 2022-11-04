package scanner

import (
	"fmt"
	"os"
	"regexp"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

type ruleMatch struct {
	RuleName    string
	DisplayName string
	Confidence  string
	Identifier  string
	MatchedData []string
	MatchType   string
	LineCount   int
}

type matchInfo struct {
	ruleMatch
	RowStr string
	Values []string
}

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

var space = regexp.MustCompile(`\s+`)

// filtering out e.g. postgres connection commands
var urlPassword = regexp.MustCompile(`((\/\/|%2F%2F)\S+(:|%3A))\S+(@|%40)`)

func scanDataStore(adapter Adapter, scanOpts ScanOpts) ([]ruleMatch, error) {
	err := adapter.Init(scanOpts.UrlStr)
	if err != nil {
		return nil, err
	}

	tables, err := adapter.FetchTables()
	if err != nil {
		return nil, err
	}

	if len(tables) > 0 {
		limit := scanOpts.Limit
		matchList := []ruleMatch{}

		var g errgroup.Group
		var appendMutex sync.Mutex
		var queryMutex sync.Mutex

		for _, table := range tables {
			// important - do not remove
			// https://go.dev/doc/faq#closures_and_goroutines
			table := table

			g.Go(func() error {
				start := time.Now()

				// limit to one query at a time
				queryMutex.Lock()
				tableData, err := adapter.FetchTableData(table, limit)
				queryMutex.Unlock()

				if scanOpts.Debug {
					duration := time.Now().Sub(start)
					fmt.Fprintf(os.Stderr, "Scanned %s (%d ms)\n", table.displayName(), duration.Milliseconds())
				}

				if err != nil {
					return err
				}

				matchFinder := NewMatchFinder(scanOpts.MatchConfig)
				tableMatchList := matchFinder.CheckTableData(table, tableData)
				appendMutex.Lock()
				matchList = append(matchList, tableMatchList...)
				appendMutex.Unlock()

				return nil
			})
		}

		if err := g.Wait(); err != nil {
			return nil, err
		}

		return matchList, nil
	} else {
		return nil, nil
	}
}
