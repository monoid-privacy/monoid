FROM golang:1.18-alpine AS build
COPY . /app
WORKDIR /app
RUN go mod download
RUN go build -o monoid-loader ./cmd/tools/loader/main.go

FROM alpine:3.14
WORKDIR /app
COPY --from=build /app/monoid-loader monoid-loader
COPY --from=build /app/config-data config-data

ENTRYPOINT [ "./monoid-loader" ]
