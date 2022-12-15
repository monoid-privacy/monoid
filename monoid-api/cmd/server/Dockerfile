FROM golang:1.18-alpine AS build
COPY . /app
WORKDIR /app
RUN go mod download
RUN go build -o server ./cmd/server/main.go

FROM alpine:3.14
WORKDIR /app
COPY --from=build /app/server server
COPY --from=build /app/config-data config-data

CMD [ "./server" ]