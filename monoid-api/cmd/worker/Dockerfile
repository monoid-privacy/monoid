FROM golang:1.18-alpine AS build
COPY . /app
WORKDIR /app
RUN go mod download
RUN go build -o worker ./cmd/worker/main.go

FROM alpine:3.14
WORKDIR /app
COPY --from=build /app/worker worker
COPY --from=build /app/config-data config-data
CMD [ "./worker" ]