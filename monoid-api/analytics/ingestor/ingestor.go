package ingestor

type Ingestor interface {
	Identify(userID *string, traits map[string]interface{}) error
	Track(event string, userID *string, properties map[string]interface{}) error
	Close() error
}
