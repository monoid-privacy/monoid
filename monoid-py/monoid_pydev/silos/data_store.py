from typing import Dict, Any, Iterable, Optional

from monoid_pydev.models import MonoidRecord, MonoidSchema, MonoidQueryIdentifier
from abc import ABC, abstractmethod

from monoid_pydev.models.models import MonoidPersistenceConfig, MonoidRequestHandle, MonoidRequestResult, MonoidRequestStatus


class DataStore(ABC):
    def to_brist_schema(self):
        return MonoidSchema(
            name=self.name(),
            group=self.group(),
            json_schema=self.json_schema()
        )

    @abstractmethod
    def name(self) -> str:
        """
        Get the name of the datastore.
        """

    @abstractmethod
    def group(self) -> Optional[str]:
        """
        Get the group of the datastore.
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
    ):
        """
        To be implemented by subclasses.
        """
