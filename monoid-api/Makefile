BIN_DIR = bin
.PHONY: bin/worker bin/loader bin/server bin/discovery

test:
	go test ./...

build: bin/worker bin/loader bin/server bin/discovery

bin/worker:
	go build -o $@ cmd/worker/main.go 

bin/loader:
	go build -o $@ cmd/tools/loader/main.go

bin/server:
	go build -o $@ cmd/server/main.go

bin/discovery:
	go build -o $@ cmd/tools/discovery/main.go
