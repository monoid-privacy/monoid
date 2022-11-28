package scanner

import (
	"github.com/monoid-privacy/monoid/monoidprotocol"
)

type Scanner interface {
	Scan(*monoidprotocol.MonoidRecord) error
	Summary() []RuleMatch
}
