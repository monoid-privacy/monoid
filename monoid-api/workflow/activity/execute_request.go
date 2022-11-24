package activity

import (
	"strings"
)

type combinedErrors struct {
	Errors []string
}

func (c combinedErrors) Error() string {
	return strings.Join(c.Errors, ",")
}

func newCombinedErrors(errors []error) combinedErrors {
	errorStrings := make([]string, len(errors))
	for _, err := range errors {
		errorStrings = append(errorStrings, err.Error())
	}
	return combinedErrors{
		Errors: errorStrings,
	}
}

func safeDeref[T any](p *T) T {
	if p == nil {
		var v T
		return v
	}
	return *p
}
