FROM golang:1.18-alpine
COPY . /app
WORKDIR /app
RUN go mod download
RUN go build -o monoid-loader ./cmd/tools/loader/main.go
ENTRYPOINT [ "./monoid-loader" ]
