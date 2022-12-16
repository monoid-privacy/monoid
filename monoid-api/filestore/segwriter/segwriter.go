package segwriter

import (
	"bytes"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
)

type segmentedWriter struct {
	activeBuffer *bytes.Buffer
	lock         sync.Mutex
	closeCh      chan bool
	closed       bool
}

// NewSegmentedWriter creates a writer that will write
// all data written to it to the writers returned by writerGen.
// writerGen is called every updateInterval, and all data that is
// currently not persisted to a writer returned by writerGen is
// written back to the result.
func NewSegmentedWriter(
	writerGen func(i int) io.WriteCloser,
	updateInterval time.Duration,
) io.WriteCloser {
	sw := &segmentedWriter{
		activeBuffer: new(bytes.Buffer),
		lock:         sync.Mutex{},
		closeCh:      make(chan bool),
	}

	go func() {
		i := 0
	L:
		for {
			wr := writerGen(i)
			ticker := time.NewTicker(updateInterval)
			defer ticker.Stop()

			select {
			case <-ticker.C:
				if err := sw.pushData(wr); err != nil {
					log.Err(err).Msg("Error pushing data")
				}

				wr.Close()
			case <-sw.closeCh:
				if err := sw.pushData(wr); err != nil {
					log.Err(err).Msg("Error pushing data")
				}

				wr.Close()
				break L
			}

			i += 1
		}
	}()

	return sw
}

func (s *segmentedWriter) pushData(writer io.WriteCloser) error {
	s.lock.Lock()
	buf := s.activeBuffer
	s.activeBuffer = new(bytes.Buffer)
	s.lock.Unlock()

	_, err := io.Copy(writer, buf)
	if err != nil {
		return err
	}

	return nil
}

func (s *segmentedWriter) Write(p []byte) (n int, err error) {
	if s.closed {
		return 0, fmt.Errorf("write on closed channel")
	}

	s.lock.Lock()
	defer s.lock.Unlock()
	return s.activeBuffer.Write(p)
}

func (s *segmentedWriter) Close() error {
	s.closed = true
	s.closeCh <- true
	return nil
}
