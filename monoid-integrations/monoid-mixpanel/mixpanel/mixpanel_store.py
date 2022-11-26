from typing import Dict, Any, Iterable, Optional

from abc import ABC, abstractmethod
from monoid_pydev.silos.db_data_store import DataStore
import requests
from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult, RequestType, MonoidRequestStatus, MonoidPersistenceConfig, RecordType
)

def switch_request_status(request_status: str) -> RequestType:
    if request_status ==  "SUCCESS": 
        return RequestType.COMPLETE
    if request_status in ["FAILURE", "REVOKED", "NOT FOUND", "UNKNOWN"]: 
        return RequestType.FAILED
    return RequestType.PROGRESS



class MixpanelDataStore(DataStore):
    def __init__(self, project_name: str, project_token: str, oauth_token: str):
        self._project_name = project_name 
        self._project_token = project_token
        self._oauth_token = oauth_token

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
        return "user_activity"

    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
        """
        return self._project_name

    def json_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON schema of the data store.
        """
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
        headers = {"Authorization": f"Bearer {self.oauth_token}"}
        body = {
            # TODO: get compliance type from request
            "compliance_type" : "CCPA", 
            "distinct_ids" : [user_id],
        }
        url = f"https://mixpanel.com/api/app/data-retrievals/v3.0/?token={self._project_token}"
        r = requests.post(url, json=body, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if "status" in r and r["status"] == "ok":
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
        headers = {"Authorization": f"Bearer {self.oauth_token}"}
        body = {
            # TODO: get compliance type from request
            "compliance_type" : "CCPA", 
            "distinct_ids" : [user_id],
        }
        url = f"https://mixpanel.com/api/app/data-deletions/v3.0/?token={self._project_token}"
        r = requests.post(url, json=body, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if "status" in r and r["status"] == "ok":
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
        headers = {"Authorization": f"Bearer {self.oauth_token}"}
        url = f"https://mixpanel.com/api/app/data-deletions/v3.0/{handle.data['handle']}?token={self._project_token}"
        r = requests.get(url, headers=headers).json()
        request_status = RequestStatus.FAILED
        handle = ""
        if "status" in r and r["status"] == "ok":
            status = r["results"]["status"]
            request_status = switch_request_status(handle)

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
        headers = {"Authorization": f"Bearer {self.oauth_token}"}
        url = f"https://mixpanel.com/api/app/data-retrievals/v2.0/{handle.data['handle']}/?token={self._project_token}"
        r = requests.get(url, headers=headers).json()
        request_status = RequestStatus.FAILED
        record = None
        if "status" in r and r["status"] == "ok":
            status = r["results"]["status"]
            request_status = switch_request_status(handle)
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

    @abstractmethod
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
            status, record = self._query_request_status(persistence_conf, handle)
            if record is not None: 
                return [record]
        return []

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        """
        To be implemented by subclasses.
        """
        # No-op for Mixpanel
        pass