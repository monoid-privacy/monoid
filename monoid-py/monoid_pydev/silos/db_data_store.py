from typing import Dict, Any, Iterable, Optional

from monoid_pydev.models import (
    MonoidRecord, MonoidSchema, MonoidQueryIdentifier, RequestStatus, DataType,
    MonoidRequestHandle, MonoidRequestResult
)
from abc import ABC, abstractmethod

from monoid_pydev.models.models import MonoidPersistenceConfig, MonoidRequestStatus, RequestType
from monoid_pydev.silos.data_store import DataStore


class DBDataStore(DataStore):
    @abstractmethod
    def query_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> Iterable[MonoidRecord]:
        """
        To be implemented by subclasses.
        """

    @abstractmethod
    def delete_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ):
        """
        To be implemented by subclasses.
        """

    @abstractmethod
    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema,
    ):
        """
        To be implemented by subclasses.
        """

    def run_query_request(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQueryIdentifier,
    ) -> MonoidRequestResult:
        """
        The base behavior for a DB Data store is to return that the request
        is complete, and run the query in scan_records.
        """

        return MonoidRequestResult(
            status=MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=RequestStatus.COMPLETE,
                data_type=DataType.RECORDS
            ),
            handle=MonoidRequestHandle(
                schema_group=self.group(),
                schema_name=self.name(),
                request_type=RequestType.QUERY,
                data={
                    "query": query
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

        self.delete_records(persistence_conf, query)

        return MonoidRequestResult(
            status=MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=RequestStatus.COMPLETE,
                data_type=DataType.NONE
            ),
            handle=MonoidRequestHandle(
                schema_group=self.group(),
                schema_name=self.name(),
                data={
                    "query": query
                }
            )
        )

    def request_status(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> MonoidRequestStatus:
        """
        Gets the status of a request
        """

        if handle.request_type == RequestType.QUERY:
            return MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=RequestStatus.COMPLETE,
                data_type=DataType.RECORDS
            )
        elif handle.request_type == RequestType.DELETE:
            return MonoidRequestStatus(
                schema_group=self.group(),
                schema_name=self.name(),
                request_status=RequestStatus.COMPLETE,
                data_type=DataType.NONE
            )

        raise ValueError(f"Unknown request type {handle.request_type}")

    def request_results(
        self,
        persistence_conf: MonoidPersistenceConfig,
        handle: MonoidRequestHandle
    ) -> Iterable[MonoidRecord]:
        """
        Gets the result of a request
        """

        if handle.data is None:
            return

        if handle.request_type == RequestType.QUERY:
            query = MonoidQueryIdentifier.parse_obj(handle.data["query"])
            yield from self.query_records(persistence_conf, query)
            return
        elif handle.request_type == RequestType.DELETE:
            return

        raise ValueError(f"Unknown request type {handle.request_type}")
