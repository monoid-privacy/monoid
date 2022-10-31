from abc import ABC, abstractmethod
import json
from re import S
from typing import Any, Iterable, Mapping, List

from requests import delete

from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidQuery, MonoidRecord, MonoidSchema, MonoidSiloSpec, MonoidSchemasMessage
import monoid_pydev.utils as utils


class AbstractSilo(ABC):
    @abstractmethod
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        """
        Gets the data stores that make up this silo.
        """

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
        query: MonoidQuery,
    ) -> Iterable[MonoidRecord]:
        """
        Queries records from a data silo based on a specific query.
        """
        data_stores = {(d.group(), d.name())
                        : d for d in self.data_stores(conf=conf)}

        for query_rule in query.identifiers:
            data_store = data_stores[(
                query_rule.schema_group, query_rule.schema_name)]

            yield from data_store.query_records(query_rule)

    def delete(
        self,
        conf: Mapping[str, Any],
        query: MonoidQuery
    ) -> Iterable[MonoidRecord]:
        """
        Deletes records from the data silo based on a given query.
        """
        data_stores = {(d.group(), d.name())
                        : d for d in self.data_stores(conf=conf)}

        for query_rule in query.identifiers:
            data_store = data_stores[(
                query_rule.schema_group, query_rule.schema_name)]

            yield from data_store.delete_records(query_rule)

    def sample(
        self,
        conf: Mapping[str, Any],
        schemas: MonoidSchemasMessage,
    ) -> Iterable[MonoidRecord]:
        """
        Returns a sample of the records in the data silo, to be used for data
        scanning.
        """

        data_stores = {
            (d.group(), d.name()): d for d in self.data_stores(conf=conf)}

        for schema in schemas.schemas:
            data_store = data_stores[(
                schema.group, schema.name
            )]

            yield from data_store.sample_records(schema)

    def parse_config(
        self,
        conf_file: str
    ) -> Mapping[str, Any]:
        """
        Parse a config file.
        """
        with open(conf_file, "r") as f:
            return json.loads(f.read())

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
