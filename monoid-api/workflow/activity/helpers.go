package activity

type DataSourceMatcher struct {
	Group string
	Name  string
}

func NewDataSourceMatcher(name string, group *string) DataSourceMatcher {
	gr := ""
	if group != nil {
		gr = *group
	}

	return DataSourceMatcher{
		Name:  name,
		Group: gr,
	}
}
