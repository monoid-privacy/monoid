from typing import Dict, Any, Iterable, Optional

from abc import ABC, abstractmethod
from monoid_pydev.silos.db_data_store import DataStore
import requests
from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult, RequestType, MonoidRequestStatus, MonoidPersistenceConfig, RecordType
)

from datetime import date

def switch_request_status(request_status: str) -> RequestType:
    if request_status ==  "SUCCESS": 
        return RequestType.COMPLETE
    if request_status in ["FAILURE", "REVOKED", "NOT FOUND", "UNKNOWN"]: 
        return RequestType.FAILED
    return RequestType.PROGRESS

class AmplitudeDataStore(DataStore):
    def __init__(self, api_key: str, secret_key: str, project_name: str, start_date: str, owner_email: str):
        self._api_key = api_key
        self._secret_key = secret_key
        self._project_name = project_name
        self._start_date = start_date 
        self._owner_email = owner_email

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
                }, 
                "amplitude_id": {
                    type: "string"
                }
            }
        }


# class MonoidQueryIdentifier(BaseModel):
#     schema_name: str
#     schema_group: Optional[str] = None
#     identifier: str
#     identifier_query: Union[str, int]
#     json_schema: Dict[str, Any]

    # TODO: do we just use the CCPA query endpoint for all query requests? 
    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        Starts a query request
        """
        identifier = ""
        if query.identifier == "amplitude_id": 
            identifier = "amplitudeId"
        if query.identifier == "user_id": 
            identifier = "userId"
        base_url = 'https://amplitude.com/api/2/dsar/requests'
        end_date = date.today().strftime("%Y-%m-%d")
        payload = {
        identifier: query.identifier_query,
        "startDate": self._start_date,
        "endDate": end_date
        }
        r = requests.post(base_url, auth=(self._api_key, self._secret_key), data=payload)
        request_id = r.json().get('requestId')
        if request_id is None: 
            request_status = RequestStatus.FAILED 
        else: 
            request_status = RequestStatus.PENDING

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
                    "handle": request_id,
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
        url = "https://amplitude.com/api/2/deletions/users"
        if query.query_identifier == "amplitude_id":
            identifier = "amplitude_ids"
        if query.query_identifier == "user_id": 
            identifier = "user_ids"
        payload = {
        identifier: [
            query.identifier_query
        ],
        "ignore_invalid_id": "true",
        "delete_from_org": "false",
        "requester": self._owner_email
        }

        r = requests.post(url, auth=(self._api_key, self._secret_key), data=payload)

        if r.json().get("status") in ["Staging", "Submitted", "Done"]:
            pass
        pass


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
    ) -> (MonoidRequestStatus, Optional[Iterable[MonoidRecord]]): 
        request_id = handle.data.get("handle")
        base_url = f'https://amplitude.com/api/2/dsar/requests'
        r = requests.get(f'{base_url}/{request_id}', auth=(self._api_key, self._secret_key))
        response = r.json()
        if response.get('status') == 'failed':
            return MonoidRequestStatus(
                schema_group=self.group(), 
                schema_name=self.name(),
                request_status=RequestStatus.FAILED,
                data_type=DataType.FILE
            ), None
        if response.get('status') == 'done':
            urls = response.get("urls")
            if urls is not None:
                # TODO: Should there be a record for each url? 
                return MonoidRequestStatus(
                    schema_group=self.group(), 
                    schema_name=self.name(),
                    request_status=RequestStatus.COMPLETE,
                    data_type=DataType.FILE
                ), [MonoidRecord(
                        record_type=RecordType.FILE, 
                        schema_name=self.name(), 
                        schema_group=self.group(), 
                        file=url
                    ) for url in urls]
        return MonoidRequestStatus(
                schema_group=self.group(), 
                schema_name=self.name(),
                request_status=RequestStatus.PENDING,
                data_type=DataType.FILE
            ), None

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
        else: 
            # TODO: Error handle when the request type is incorrect
            pass

    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """
        # TODO: Is empty array ok for deletion?
        if handle.request_type == RequestType.QUERY: 
            _, records = self._query_request_status(persistence_conf, handle)
            if records is not None: 
                return records
        return []

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        """
        To be implemented by subclasses.
        """
        # TODO: Find a way to implement scanning
        pass