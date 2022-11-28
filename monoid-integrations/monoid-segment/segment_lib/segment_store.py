from typing import Dict, Any, Iterable, Optional, Array
from enum import Enum
from abc import ABC, abstractmethod
from monoid_pydev.silos.db_data_store import DataStore
import requests
from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult, RequestType, MonoidRequestStatus, MonoidPersistenceConfig, RecordType
)

from segment.segment_silo import SegmentStoreType

def chained_get(d: Optional[Dict[str, Any]], keys: Array[str]) -> Optional[Any]:
    if d is None or len(keys) == 0:
        return None
    if len(keys) == 1: 
        return  d.get(keys[0])
    return chained_get(d.get(keys[0]), keys[1:])

def switch_request_status(request_status: str) -> RequestType:
    if request_status ==  "FINISHED": 
        return RequestType.COMPLETE
    if request_status in ["FAILED", "INVALID", "NOT_SUPPORTED", "PARTIAL_SUCCESS"]: 
        return RequestType.FAILED
    return RequestType.PROGRESS
            
class SegmentDataStore(DataStore): 
    def __init__(self, api_key: str, workspace_id: str): 
        self._api_key = api_key 
        self._workspace_id = workspace_id

    def name(self) -> str:
        """
        Get the name of the datastore.
        """
        return "user_activity"

    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
        """
        return self._workspace_id


    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "userId": {
                    type: "string"
                }
            }
        }
        return schema



    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        No-op for User silo (handled by User Activity)
        """
        pass

    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        No-op for User silo (handled by User Activity)
        """
        url = "https://api.segmentapis.com/regulations"
        user_id = query.identifier_query
        headers = {"Authorization": f"Bearer {self.api_key}"}
        body = {
            "subjectIds" : [user_id],
            "regulationType": "SUPPRESS_WITH_DELETE",
            "subjectType": "USER_ID"
        }
        r = requests.post(url, json=body, headers=headers).json()
        data = r.get("data")
        if data is not None: 
            regulate_id = data.get("regulateId")
            return MonoidRequestResult(
                status=MonoidRequestStatus(
                    schema_group=self.group(), 
                    schema_name=self.name(), 
                    request_status=RequestStatus.PROGRESS, 
                    data_type=DataType.NONE
                ), 
                handle=MonoidRequestHandle(
                    schema_group=self.group(), 
                    schema_name=self.name(), 
                    request_status=RequestStatus.PROGRESS,
                    data={
                        "handle": regulate_id
                    }
                )
            )
        # TODO: Error handle
        pass

    def _deletion_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus: 
        regulate_id = handle.data.get("handle")
        url = f"https://api.segmentapis.com/regulations/{regulate_id}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        r = requests.get(url, headers=headers).json()
        status = chained_get(r, ["data", "regulation", "overallStatus"])
        # TODO: Error handle
        return MonoidRequestStatus(
            schema_group=self.group(), 
            schema_name=self.name(), 
            request_status=switch_request_status(status), 
            data_type=DataType.NONE
        )
        
    def request_status(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus:
        """
        No-op for User silo (handled by User Activity)
        """
        if handle.request_type == RequestType.DELETE: 
            return self._deletion_request_status(persistence_conf, handle)
        # TODO: Error handle
        # TODO: no query request without profiles
        pass

        
    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        No-op for User silo (handled by User Activity)
        """
        pass

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ) -> Iterable[MonoidRecord]:
        """
        Sample records from table
        """
        pass

