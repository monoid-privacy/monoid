from typing import Dict, Any, Iterable, Optional, Tuple
from enum import Enum
from abc import ABC, abstractmethod
import zipfile
import tarfile 
import os
import urllib.parse
import uuid
from monoid_pydev.silos.db_data_store import DataStore
import requests
import zipfile 
import tarfile
from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult, RequestType, MonoidRequestStatus, MonoidPersistenceConfig, RecordType
)

class IntercomStoreType(Enum):
    CONTACT = 'Contact'
    CONVERSATION = 'Conversation'
    EVENT = 'Event'

def switch_request_status(request_status: str) -> RequestType:
    if request_status ==  "SUCCESS": 
        return RequestStatus.COMPLETE
    if request_status in ["FAILURE", "REVOKED", "NOT FOUND", "UNKNOWN"]: 
        return RequestStatus.FAILED
    return RequestStatus.PROGRESS


class IntercomDataStore(DataStore):
    def __init__(self, access_token: str, workspace: str):
        self._access_token = access_token
        self._workspace = workspace

    def _get_request_headers(self) -> Dict[str, str]:
        return { "Authorization": f"Bearer {self._access_token}" }

    def to_brist_schema(self):
        return MonoidSchema(
            name=self.name(),
            group=self.group(),
            json_schema=self.json_schema()
        )

    def _get_intercom_id(self, query: MonoidQueryIdentifier) -> Optional[Iterable[str]]:
        """
        Get the intercom id from the query.
        """
        identifier = query.identifier
        if identifier == "id":
            return query.identifier_query
        else:
            url = f"https://api.intercom.io/contacts/search"
            query_filter = {
                "query": {
                    "field": identifier,
                    "operator": "=",
                    "value": query.identifier_query
                }
            }
            r = requests.post(url, json=query_filter, headers=self._get_request_headers())
            response = r.json()
            if r.status_code == 200: 
                ids = [] 
                for contact in response["data"]:
                    ids.append(contact["id"])
                # TODO: handle multiple ids
                return ids[0]
            else:
                return None
        

    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
        """
        return self._workspace

    def request_status(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus:
        """
        Gets the status of a request
        """
        if handle.request_type == RequestType.QUERY:
            data_type = DataType.RECORDS
        elif handle.request_type == RequestType.DELETE:
            data_type = DataType.NONE
        else:
            raise ValueError(f"Unknown request type: {handle.request_type}")
        return MonoidRequestStatus(
            schema_group=self.group(),
            schema_name=self.name(),
            request_status=RequestStatus.COMPLETE,
            data_type=data_type
        )

    @abstractmethod
    def name(self) -> str:
        """
        Get the name of the datastore.
        """

    @abstractmethod
    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """

    @abstractmethod
    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a query request
        """

    @abstractmethod
    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a delete request
        """
        
    @abstractmethod
    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """

    @abstractmethod
    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ) -> Iterable[MonoidRecord]:
        """
        Samples records from the datastore
        """

class IntercomContactStore(IntercomDataStore): 
    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """

        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$id": "http://example.com/example.json",
            "type": "object",
            "title": "Contact",
            "properties": {
                "type": {
                    "type": "string"
                },
                "id": {
                    "type": "string"
                },
                "workspace_id": {
                    "type": "string"
                },
                "external_id": {
                    "type": "string"
                },
                "role": {
                    "type": "string"
                },
                "email": {
                    "type": "string"
                },
                "phone": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "avatar": {
                    "type": "string"
                },
                "owner_id": {
                    "type": "number"
                },
                "social_profiles": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "string"
                                    },
                                    "name": {
                                        "type": "string"
                                    },
                                    "url": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "has_hard_bounced": {
                    "type": "boolean"
                },
                "marked_email_as_spam": {
                    "type": "boolean"
                },
                "unsubscribed_from_emails": {
                    "type": "boolean"
                },
                "created_at": {
                    "type": "integer"
                },
                "updated_at": {
                    "type": "integer"
                },
                "signed_up_at": {
                    "type": "integer"
                },
                "last_seen_at": {
                    "type": "integer"
                },
                "last_replied_at": {
                    "type": "integer"
                },
                "last_contacted_at": {
                    "type": "integer"
                },
                "last_email_opened_at": {
                    "type": "integer"
                },
                "last_email_clicked_at": {
                    "type": "integer"
                },
                "language_override": {
                    "type": ["string", "null"]
                },
                "browser": {
                    "type": "string"
                },
                "browser_version": {
                    "type": "string"
                },
                "browser_language": {
                    "type": "string"
                },
                "os": {
                    "type": "string"
                },
                "location": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "country": {
                            "type": "string"
                        },
                        "region": {
                            "type": "string"
                        },
                        "city": {
                            "type": "string"
                        }
                    }
                },
                "android_app_name": {
                    "type": ["string", "null"]
                },
                "android_app_version": {
                    "type": ["string", "null"]
                },
                "android_device": {
                    "type": ["string", "null"]
                },
                "android_os_version": {
                    "type": ["string", "null"]
                },
                "android_sdk_version": {
                    "type": ["string", "null"]
                },
                "android_last_seen_at": {
                    "type": ["integer", "null"]
                },
                "ios_app_name": {
                    "type": ["string", "null"]
                },
                "ios_app_version": {
                    "type": ["string", "null"]
                },
                "ios_device": {
                    "type": ["string", "null"]
                },
                "ios_os_version": {
                    "type": ["string", "null"]
                },
                "ios_sdk_version": {
                    "type": ["string", "null"]
                },
                "ios_last_seen_at": {
                    "type": ["integer", "null"]
                },
                "custom_attributes": {
                    "type": "object",
                    "properties": {
                        "paid_subscriber": {
                            "type": "boolean"
                        },
                        "monthly_spend": {
                            "type": "number"
                        },
                        "team_mates": {
                            "type": "number"
                        }
                    }
                },
                "tags": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "string"
                                    },
                                    "id": {
                                        "type": "string"
                                    },
                                    "url": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "url": {
                            "type": "string"
                        },
                        "total_count": {
                            "type": "number"
                        },
                        "has_more": {
                            "type": "boolean"
                        }
                    }
                },
                "notes": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "string"
                                    },
                                    "id": {
                                        "type": "string"
                                    },
                                    "url": {
                                        "type": "string"
                                    },
                                }
                            }
                        },

                        "url": {
                            "type": "string"
                        },
                        "total_count": {
                            "type": "number"
                        },
                        "has_more": {
                            "type": "boolean"
                        }
                    }
                },
                "opted_out_subscription_types": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {
                                        "type": "string"
                                    },
                                    "type": {
                                        "type": "string"
                                    },
                                    "url": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "url": {
                            "type": "string"
                        },
                        "total_count": {
                            "type": "number"
                        },
                        "has_more": {
                            "type": "boolean"
                        }
                    }
                }
            }
        }

    def name(self) -> str:
        """
        Get the name of the datastore.
        """
        return IntercomStoreType.CONTACT.value

    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        query_filter = {
            "query": {
                "field": query.identifier, 
                "operator": "=",
                "value": query.identifier_query,
            }
        }
        url = f"https://api.intercom.io/contacts/search"
        print(query_filter)
        r = requests.post(url, json=query_filter, headers=self._get_request_headers())
        request_status = RequestStatus.FAILED
        response = r.json()
        if r.status_code == 200:
            request_status = RequestStatus.COMPLETE

        return MonoidRequestResult(
            status=MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=request_status,
                data_type=DataType.RECORDS,
            ),
            handle=MonoidRequestHandle(
                schema_group=self.group(),
                schema_name=self.name(),
                request_type=RequestType.QUERY,
                data={
                    "response": response,
                }
            )
        )

    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        intercom_id = self._get_intercom_id(query)
        request_status = RequestStatus.FAILED
        response = None
        if intercom_id is not None: 
            url = f"https://api.intercom.io/contacts/{intercom_id}"
            r = requests.delete(url, headers=self._get_request_headers())
            if r.status_code == 200:
                request_status = RequestStatus.COMPLETE
                response = r.json()
                return MonoidRequestResult(
                    status=MonoidRequestStatus(
                        schema_group=self.group(),
                        schema_name=self.name(),
                        request_status=request_status,
                        data_type=DataType.NONE, 
                    ),
                    handle=MonoidRequestHandle(
                        schema_group=self.group(),
                        schema_name=self.name(),
                        request_type=RequestType.DELETE,
                        data={
                            "response": response,
                        }
                    )
                )
        return MonoidRequestResult(
            status=MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=RequestStatus.FAILED,
                data_type=DataType.NONE,
            ),
            handle=MonoidRequestHandle(
                schema_group=self.group(),
                schema_name=self.name(),
                request_type=RequestType.DELETE,
                data={
                    "response": response,
                }
            )
        )
        
    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        if handle.request_type == RequestType.QUERY:
            return [MonoidRecord(
                schema_group=self.group(),
                schema_name=self.name(),
                data=handle.data.get("response")
            )]
        return []

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ) -> Iterable[MonoidRecord]:
        """
        Sample records from table
        """
        url = f"https://api.intercom.io/contacts"
        r = requests.get(url, headers=self._get_request_headers())
        if r.status_code == 200:
            return [MonoidRecord(
                schema_group=self.group(),
                schema_name=self.name(),
                data=r.json()
            )]
        return []

class IntercomConversationStore(IntercomDataStore): 
    def json_schema(self) -> Dict[str, Any]: 
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$id": "http://example.com/example.json",
            "type": "object",
            "title": "Conversation",
            "properties": {
                "type": {
                    "type": "string"
                },
                "id": {
                    "type": "string"
                },
                "created_at": {
                    "type": "integer"
                },
                "updated_at": {
                    "type": "integer"
                },
                "source": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "id": {
                            "type": "string"
                        },
                        "delivered_as": {
                            "type": "string"
                        },
                        "subject": {
                            "type": "string"
                        },
                        "body": {
                            "type": "string"
                        },
                        "author": {
                            "type": "object"
                        },
                        "attachments": {
                            "type": "array",
                            "items": {
                                "type": "object"
                            }
                        },
                        "url": {
                            "type": "string"
                        },
                        "redacted": {
                            "type": "boolean"
                        }
                    }
                },
                "contacts": {
                    "type": "array",
                    "items": {
                        "type": "object"
                    }
                },
                "teammates": {
                    "type": "array",
                    "items": {
                        "type": "object"
                    }
                },
                "title": {
                    "type": "string"
                },
                "admin_assignee_id": {
                    "type": ["integer", "null"]
                },
                "team_assignee_id": {
                    "type": ["string", "null"]
                },
                "custom_attributes": {
                    "type": "object"
                },
                "open": {
                    "type": "boolean"
                },
                "state": {
                    "type": "string"
                },
                "read": {
                    "type": "boolean"
                },
                "waiting_since": {
                    "type": ["integer", "null"]
                },
                "snoozed_until": {
                    "type": ["integer", "null"]
                },
                "tags": {
                    "type": "array",
                    "items": {
                        "type": "object"
                    }
                },
                "first_contact_reply": {
                    "type": "object"
                },
                "priority": {
                    "type": "string"
                },
                "sla_applied": {
                    "type": "object"
                },
                "conversation_rating": {
                    "type": "object"
                },
                "statistics": {
                    "type": "object"
                },
                "conversation_parts": {
                    "type": "array",
                    "items": {
                        "type": "object"
                    }
                }
            }
        }


    def name(self) -> str:
        """
        Get the name of the datastore.
        """
        return IntercomStoreType.CONVERSATION.value
    
    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a query request
        """
        pass
    
    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a delete request
        """
        pass

    def _deletion_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus: 
        """
        Gets the status of a deletion request
        """
        pass

    def _query_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> Optional[Tuple[MonoidRequestStatus, MonoidRecord]]: 
        pass

    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """
        return []
    
    def request_status(
    self,
    persistence_conf: MonoidPersistenceConfig,
    handle: MonoidRequestHandle
) -> MonoidRequestStatus:
        """
        Gets the status of a request
        """
        pass

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        # No-op for User Activity 
        return []

class IntercomEventStore(IntercomDataStore): 
    def json_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$id": "http://example.com/example.json",

            "title": "Data Event",
            "required": ["event_name", "created_at"],
            "properties": {
                "event_name": {
                    "type": "string"
                },
                "created_at": {
                    "type": "integer"
                },
                "user_id": {
                    "type": ["string", "null"]
                },
                "id": {
                    "type": ["string", "null"]
                },
                "email": {
                    "type": ["string", "null"]
                },
                "metadata": {
                    "type": ["object", "null"]
                }
            }
        }

    def name(self) -> str:
        """
        Get the name of the datastore.
        """
        return IntercomStoreType.EVENT.value

    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a query request
        """
        pass
    
    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a delete request
        """
        pass

    def _deletion_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus: 
        """
        Gets the status of a deletion request
        """
        pass

    def _query_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> Optional[Tuple[MonoidRequestStatus, MonoidRecord]]: 
        pass

    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """
        return []
    
    def request_status(
    self,
    persistence_conf: MonoidPersistenceConfig,
    handle: MonoidRequestHandle
) -> MonoidRequestStatus:
        """
        Gets the status of a request
        """
        pass

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        # No-op for User Activity 
        return []




