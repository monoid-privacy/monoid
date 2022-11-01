package ingestor

type Ingestor interface {
	Identify(userID string, traits map[string]interface{})
	Track(event string, userID string, properties map[string]interface{})
	Close()
}
