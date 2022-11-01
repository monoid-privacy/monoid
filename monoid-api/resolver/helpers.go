package resolver

import (
	"github.com/rs/zerolog/log"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

func handleError(err error, msg string) *gqlerror.Error {
	log.Err(err).Msg(msg)
	return gqlerror.Errorf(msg)

}
