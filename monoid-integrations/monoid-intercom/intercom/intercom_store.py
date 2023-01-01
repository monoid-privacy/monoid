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

    def to_brist_schema(self):
        return MonoidSchema(
            name=self.name(),
            group=self.group(),
            json_schema=self.json_schema()
        )

    def name(self) -> str:
        """
        Get the name of the datastore.
        """
        return self._store_type.value

    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
        """
        return self._workspace

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
    def request_status(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus:
        """
        Gets the status of a request
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
        No-op for User Activity
        """

class IntercomContactStore(IntercomDataStore): 
    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string"
                }
            }
        }


    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        pass

    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        pass
        
    def request_status(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus:
        """
        No-op for User silo (handled by User Activity)
        """
        pass
        
    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        return []

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ) -> Iterable[MonoidRecord]:
        """
        Sample records from table
        """
        query_cols = [f for f in schema.json_schema["properties"]]
        url = f"https://mixpanel.com/api/2.0/engage?project_id={self._project_id}"

        headers = {
            "authorization": f"Basic {self._service_account_username}:{self._service_account_password}"
        }

        response = requests.get(url, headers=headers).json()
        if response.get("status") == "ok": 
            results = response.get("results")
            for i in range(5): 
                flattened_datum = results[i].get("$properties")
                flattened_datum["$distinct_id"] = results[i].get("$distinct_id")
                yield MonoidRecord(
                    schema_name=self.name(), 
                    schema_group=self.group(), 
                    data={k:v for (k,v) in flattened_datum.items() if k in query_cols}
                )
        return []

class IntercomConversationStore(IntercomDataStore): 
    def json_schema(self) -> Dict[str, Any]: 
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string"
                }
            }
        }
    
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
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string"
                }
            }
        }
    
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




