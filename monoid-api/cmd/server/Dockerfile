FROM golang:1.18-alpine
COPY . /app
WORKDIR /app
RUN go mod download
RUN go build -o server ./cmd/server/main.go
CMD [ "./server" ]