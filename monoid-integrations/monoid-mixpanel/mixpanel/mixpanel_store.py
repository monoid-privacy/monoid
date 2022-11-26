from typing import Dict, Any, Iterable, Optional
from enum import Enum
from abc import ABC, abstractmethod
from monoid_pydev.silos.db_data_store import DataStore
import requests
from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult, RequestType, MonoidRequestStatus, MonoidPersistenceConfig, RecordType
)

from mixpanel.mixpanel_silo import MixpanelStoreType

def data_definitions_to_json_properties(results):
    props = {}
    for item in results: 
        if item.get("name"): 
                props[item.get("name")] = {
                    "type": item.get("type"), 
                    "title": item.get("displayName"), 
                    "description": item.get("description")
                }
    return props

def switch_request_status(request_status: str) -> RequestType:
    if request_status ==  "SUCCESS": 
        return RequestType.COMPLETE
    if request_status in ["FAILURE", "REVOKED", "NOT FOUND", "UNKNOWN"]: 
        return RequestType.FAILED
    return RequestType.PROGRESS

class MixpanelDataStore(DataStore):
    def __init__(self, project_name: str, project_token: str, oauth_secret: str, project_id: int, \
    store_type: MixpanelStoreType, service_account_username: str, service_account_password: str):
        self._project_name = project_name 
        self._project_id = project_id
        self._project_token = project_token
        self._oauth_secret = oauth_secret
        self._store_type = store_type
        self._service_account_username = service_account_username
        self._service_account_password = service_account_password

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
        return self._store_type

    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
        """
        return self._project_name

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
            
class MixpanelUserStore(MixpanelDataStore): 
    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
            }
        }
        url = f"https://mixpanel.com/api/2.0/data_definitions/properties?includeCustom=false&project_id={self._project_id}&resourceType=User"
        headers = {"authorization": f"Basic {self._service_account_username}:{self._service_account_password}"}
        r = requests.get(url, headers=headers).json()
        if r.get("status") == "ok":
            schema["properties"] = data_definitions_to_json_properties(r.get("results"))
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
        query_cols = [f for f in schema.json_schema["properties"]]
        url = "https://mixpanel.com/api/2.0/engage?project_id=2305897"

        headers = {
            "authorization": f"Basic {self._service_account_username}:{self._service_account_password}"
        }

        response = requests.post(url, headers=headers).json()
        if response.get("status") == "ok": 
            results = response.get("results")
            for i in range(5): 
                flattened_datum = {k:v for k, v in results[i].get("properties")}
                flattened_datum["$distinct_id"] = results[i].get("$distinct_id")
                yield MonoidRecord(
                    schema_name=self.name(), 
                    schema_group=self.group(), 
                    data={k:v for (k,v) in flattened_datum.items() if k in query_cols}
                )

class MixpanelUserActivityStore(MixpanelDataStore): 
    def json_schema(self) -> Dict[str, any]: 
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "user_id": {
                    type: "string"
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
        user_id = query.identifier_query
        headers = {"Authorization": f"Bearer {self.oauth_secret}"}
        body = {
            # TODO: get compliance type from request
            "compliance_type" : "CCPA", 
            "distinct_ids" : [user_id],
        }
        url = f"https://mixpanel.com/api/app/data-retrievals/v3.0/?token={self._project_token}"
        r = requests.post(url, json=body, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if r.get("status") == "ok":
            request_status = RequestStatus.COMPLETE
            handle = r["results"]["task_id"]

        return MonoidRequestResult(
            status=MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=request_status,
                data_type=DataType.FILE,
            ),
            handle=MonoidRequestHandle(
                schema_group=self.group(),
                schema_name=self.name(),
                request_type=RequestType.QUERY,
                data={
                    "handle": handle,
                }
            )
        )
    
    def run_delete_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a delete request
        """
        user_id = query.identifier_query
        headers = {"Authorization": f"Bearer {self.oauth_secret}"}
        body = {
            # TODO: get compliance type from request
            "compliance_type" : "CCPA", 
            "distinct_ids" : [user_id],
        }
        url = f"https://mixpanel.com/api/app/data-deletions/v3.0/?token={self._project_token}"
        r = requests.post(url, json=body, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if r.get("status") == "ok":
            request_status = RequestStatus.COMPLETE
            handle = r["results"]["task_id"]

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
                    "handle": handle,
                }
            )
        )

    def _deletion_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus: 
        """
        Gets the status of a deletion request
        """
        headers = {"Authorization": f"Bearer {self.oauth_secret}"}
        url = f"https://mixpanel.com/api/app/data-deletions/v3.0/{handle.data['handle']}?token={self._project_token}"
        r = requests.get(url, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if r.get("status") == "ok":
            status = r["results"]["status"]
            request_status = switch_request_status(status)

        return MonoidRequestStatus(
            schema_group=self.group(),
            schema_name=self.name(),
            request_status=request_status,
            data_type=DataType.NONE,
        )

    def _query_request_status(
        self, 
        persistence_conf: MonoidPersistenceConfig, 
        handle: MonoidRequestHandle
    ) -> (MonoidRequestStatus, MonoidRecord): 
        headers = {"Authorization": f"Bearer {self.oauth_secret}"}
        url = f"https://mixpanel.com/api/app/data-retrievals/v2.0/{handle.data['handle']}/?token={self._project_token}"
        r = requests.get(url, headers=headers).json()
        request_status = RequestStatus.FAILED
        record = None
        if r.get("status") == "ok":
            status = r["results"]["status"]
            request_status = switch_request_status(status)
            if request_status == RequestStatus.COMPLETE:
                record = MonoidRecord(
                    record_type=RecordType.FILE, 
                    schema_name=self.name(), 
                    schema_group=self.group(), 
                    file=r["results"]["result"]
                )

        return MonoidRequestStatus(
            schema_group=self.group(),
            schema_name=self.name(), 
            request_status=request_status,
            data_type=DataType.FILE,
        ), record
        
    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """
        # TODO: What should be returned here for a deletion? 
        if handle.request_type == RequestType.QUERY: 
            _, record = self._query_request_status(persistence_conf, handle)
            if record is not None: 
                return [record]
        return []
    
    def request_status(
    self,
    persistence_conf: MonoidPersistenceConfig,
    handle: MonoidRequestHandle
) -> MonoidRequestStatus:
        """
        Gets the status of a request
        """
        if handle.request_type == RequestType.DELETE: 
            return self._deletion_request_status(
                persistence_conf, 
                handle
            )
        elif handle.request_type == RequestType.QUERY: 
            status, _ = self._query_request_status(
                persistence_conf, 
                handle
            )
            return status

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        # No-op for User Activity 
        pass

