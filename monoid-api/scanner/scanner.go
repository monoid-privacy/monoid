package scanner

import (
	"github.com/brist-ai/monoid/monoidprotocol"
)

type Scanner interface {
	Scan(*monoidprotocol.MonoidRecord) error
	Summary() []RuleMatch
}
