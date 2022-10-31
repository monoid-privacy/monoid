from typing import Dict, Any, Iterable, Optional

from monoid_pydev.models import MonoidRecord, MonoidSchema, MonoidQueryIdentifier
from abc import ABC, abstractmethod


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
    def query_records(
        self,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        """
        To be implemented by subclasses.
        """

    @abstractmethod
    def sample_records(
        self,
        schema: MonoidSchema
    ):
        """
        To be implemented by subclasses.
        """

    @abstractmethod
    def delete_records(
        self,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        """
        To be implemented by subclasses
        """
