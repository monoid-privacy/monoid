from abc import ABC, abstractmethod
import json
from re import S
from typing import Any, Iterable, Mapping, List, Optional
from monoid_pydev.models.models import MonoidRequestResult, MonoidRequestStatus, MonoidRequestsMessage

from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import (
    MonoidQuery, MonoidRecord, MonoidSchema,
    MonoidSiloSpec, MonoidSchemasMessage, MonoidValidateMessage,
    MonoidPersistenceConfig, MonoidRequestHandle
)
import monoid_pydev.utils as utils


class AbstractSilo(ABC):
    @abstractmethod
    def data_stores(
        self,
        conf: Mapping[str, Any],
    ) -> List[DataStore]:
        """
        Gets the data stores that make up this silo.
        """

    def _data_stores_map(self, conf: Mapping[str, Any]):
        return {(d.group(), d.name()): d for d in self.data_stores(conf=conf)}

    def schemas(self, conf: Mapping[str, Any]) -> MonoidSchemasMessage:
        """
        Returns the set of schemas that are present in a data silo.
        """

        return MonoidSchemasMessage(schemas=[
            d.to_brist_schema() for d in self.data_stores(conf)
        ])

    def spec(self) -> MonoidSiloSpec:
        """
        Returns the spec for the silo.
        """
        f = utils.load_package_file(
            self.__class__.__module__.split(".")[0], "spec.json")
        if f is None:
            raise FileNotFoundError

        return MonoidSiloSpec.parse_obj(json.loads(f))

    def query(
        self,
        conf: Mapping[str, Any],
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQuery,
    ) -> Iterable[MonoidRequestResult]:
        """
        Queries records from a data silo based on a specific query.
        """
        data_stores = self._data_stores_map(conf)

        for query_rule in query.identifiers or []:
            data_store = data_stores[(
                query_rule.schema_group, query_rule.schema_name)]

            yield data_store.run_query_request(
                persistence_conf,
                query_rule
            )

    def delete(
        self,
        conf: Mapping[str, Any],
        persistence_conf: MonoidPersistenceConfig,
        query: MonoidQuery
    ) -> Iterable[MonoidRequestResult]:
        """
        Starts a monoid request that deletes records from the data silo
        based on a given query.
        """

        data_stores = self._data_stores_map(conf)

        for query_rule in query.identifiers:
            data_store = data_stores[(
                query_rule.schema_group, query_rule.schema_name)]

            yield from data_store.run_delete_request(
                persistence_conf,
                query_rule
            )

    def request_results(
        self,
        conf: Mapping[str, Any],
        persistence_conf: MonoidPersistenceConfig,
        requests: MonoidRequestsMessage,
    ) -> Iterable[MonoidRecord]:
        data_stores = self._data_stores_map(conf)

        for handle in requests.handles:
            data_store = data_stores[(
                handle.schema_group, handle.schema_name)]

            yield from data_store.request_results(
                persistence_conf,
                handle
            )

    def request_status(
        self,
        conf: Mapping[str, Any],
        persistence_conf: MonoidPersistenceConfig,
        requests: MonoidRequestsMessage,
    ) -> Iterable[MonoidRequestStatus]:
        """
        Gets the status of a request.
        """

        data_stores = self._data_stores_map(conf)

        for handle in requests.handles:
            data_store = data_stores[(
                handle.schema_group, handle.schema_name)]

            yield data_store.request_status(
                persistence_conf,
                handle,
            )

    def scan(
        self,
        conf: Mapping[str, Any],
        persistence_conf: MonoidPersistenceConfig,
        schemas: MonoidSchemasMessage,
    ) -> Iterable[MonoidRecord]:
        """
        Returns a sample of the records in the data silo, to be used for data
        scanning.
        """

        data_stores = {
            (d.group(), d.name()): d for d in self.data_stores(
                conf=conf,
            )}

        for schema in schemas.schemas:
            data_store = data_stores[(
                schema.group, schema.name
            )]

            yield from data_store.scan_records(persistence_conf, schema)

    @abstractmethod
    def validate(
        self,
        conf: Mapping[str, Any],
    ) -> MonoidValidateMessage:
        """
        Validates that the configuration is set up correctly.
        """

    def parse_config(
        self,
        conf_file: str
    ) -> Mapping[str, Any]:
        """
        Parse a config file.
        """
        with open(conf_file, "r") as f:
            return json.loads(f.read())

    def parse_requests(
        self,
        requests_file: str
    ) -> MonoidRequestsMessage:
        """
        Parse a MonoidRequestsMessage file
        """
        return MonoidRequestsMessage.parse_file(requests_file)

    def parse_schema(
        self,
        schema_file: str
    ) -> MonoidSchemasMessage:
        """
        Parse a list of schemas.
        """
        return MonoidSchemasMessage.parse_file(schema_file)

    def parse_query(
        self,
        query_file: str
    ) -> MonoidQuery:
        """
        Parse a query.
        """
        return MonoidQuery.parse_file(query_file)
