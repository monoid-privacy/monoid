package ingestor

import (
	analytics "gopkg.in/segmentio/analytics-go.v3"
)

type SegmentIngestor struct {
	client analytics.Client
	UserID *string
}

func NewSegmentIngestor(key string, userID *string) Ingestor {
	cli := analytics.New(key)

	return &SegmentIngestor{
		client: cli,
		UserID: userID,
	}
}

func (si *SegmentIngestor) Identify(userID *string, traits map[string]interface{}) {
	segTraits := analytics.NewTraits()
	for k, v := range traits {
		switch k {
		case "email":
			email, ok := v.(string)
			if !ok {
				continue
			}

			segTraits.SetEmail(email)
		case "name":
			name, ok := v.(string)
			if !ok {
				continue
			}

			segTraits.SetName(name)
		default:
			segTraits.Set(k, v)
		}
	}

	if userID == nil {
		if si.UserID == nil {
			return
		}

		userID = si.UserID
	}

	si.client.Enqueue(analytics.Identify{
		UserId: *userID,
		Traits: segTraits,
	})
}

func (si *SegmentIngestor) Track(event string, userID *string, properties map[string]interface{}) {
	props := analytics.NewProperties()

	if userID == nil {
		if si.UserID != nil {
			userID = si.UserID
		} else {
			u := ""
			userID = &u
		}
	}

	for k, v := range properties {
		props.Set(k, v)
	}

	si.client.Enqueue(analytics.Track{
		UserId:     *userID,
		Event:      event,
		Properties: props,
	})
}

func (si *SegmentIngestor) Close() {
	si.client.Close()
}
