import base64
from unicodedata import name
from monoid_pydev.silos.db_data_store import DBDataStore
from monoid_pydev.models import MonoidRecord, MonoidQueryIdentifier, MonoidSchema, MonoidPersistenceConfig
from typing import Any, Dict, Iterable, Mapping, Optional
from pypika import Table, Query, Field
import google.cloud

from bigquery_lib.helpers import get_connection, logger


def type_to_jsonschema(bq_type: str) -> Optional[str]:
    int_types = [
      "int", 
      "int64",
      "integer", 
      "mediumint",
      "smallint", 
      "tinyint", 
      "bigint", 
      "byteint"
    ]

    number_types = [
      "decimal",
      "bigdecimal",
      "bignumeric", 
      "number",
      "numeric", 
      "float", 
      "float4",
      "float8",
      "float64",
      "double", 
      "real", 
      "double precision",
    ]

    time_types = [
      "date", 
      "time", 
      "datetime", 
      "timestamp", 
      "timestamp_ltz",
      "timestamp_ntz", 
      "timestamp_tz", 
      "year",
    ]

    string_types = [
      "char", 
      "varchar", 
      "tinytext", 
      "text",
      "mediumtext",
      "longtext",
      "tinyblob",
      "blob",
      "string",
      "mediumblob",
      "longblob",
      "enum",
      "set",
      "binary",
      "varbinary",
    ]

    comp_type = bq_type.lower()

    if comp_type in int_types:
        return "integer"
    elif comp_type in number_types:
        return "number"
    elif (comp_type in string_types) or (comp_type in time_types):
        return "string"
    return None

# TODO: Make this more comprehensive
def serializable_val(val: Any) -> Any:
    if isinstance(val, (bytes, bytearray)):
        return base64.b64encode(val).decode('utf-8')

    return val


class BigQueryTableDataStore(DBDataStore):
    def __init__(
        self,
        table: str,
        db_name: str,
        schema: str,
        conf: Mapping[str, any],
        conn: Optional[google.cloud.bigquery.client.Client] = None
    ):
        self.conf = conf
        self.table = table
        self.db_name = db_name
        self.schema = schema
        self._conn = conn
        self._close_conn = True

    def _get_connection(self):
        if self._conn is not None:
            return self._conn

        self._conn = get_connection(self.conf, self.db_name)
        return self._conn

    def name(self):
        return self.table

    def group(self):
        return f"{self.db_name}/{self.schema}"

    def json_schema(self) -> Dict[str, Any]:
        # TODO: Identify indexes?
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
            }
        }

        client = self._get_connection()

        res = client.query(
            f"""
            SELECT column_name, data_type FROM {self.db_name}.INFORMATION_SCHEMA.COLUMNS
            WHERE table_name = '{self.table}''
            """
        )

        for column, _ in res:
            js_type = type_to_jsonschema(column[1])
            if js_type is not None:
                schema["properties"][column[0]] = {
                    "type": js_type
                }

        return schema

    def query_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        query_cols = [f for f in query_identifier.json_schema["properties"]]
        client = self._get_connection()

        logger.info(
            f"Querying records from table {self.group()}.{self.name()}")

        tbl = Table(f"{self.db_name}.{self.table}")
        q = Query.from_(tbl).select(
            *query_cols).where(
                Field(query_identifier.identifier) ==
            query_identifier.identifier_query)

        records = list(client.query(str(q)).results())[:-1]

        for r in records:
            vals, schema = r
            data = {} 
            for key in schema: 
                data[key] = vals[schema[key]]
            yield MonoidRecord(
                schema_name=self.name(),
                schema_group=self.group(),
                data=data
            )

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema
    ) -> Iterable[MonoidRecord]:
        client = self._get_connection()
        query_cols = [f for f in schema.json_schema["properties"]]

        logger.info(
            f"Sampling records from table {self.group()}.{self.name()}")

        tbl = Table(f"{self.db_name}.{self.table}")
        q = Query.from_(tbl).select(*query_cols).limit(5)
        records = list(client.query(str(q)).results())[:-1]

        for r in records:
            vals, schema = r
            data = {} 
            for key in schema: 
                data[key] = vals[schema[key]]
            yield MonoidRecord(
                schema_name=self.name(),
                schema_group=self.group(),
                data=data
            )

    def delete_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        client = self._get_connection()
        res = [q for q in self.query_records(persistence_conf, query_identifier)]

        logger.info(
            f"Deleting records from table {self.group()}.{self.name()}")


        tbl = Table(f"{self.db_name}.{self.table}")
        q = Query.from_(tbl).delete().where(
            Field(query_identifier.identifier) ==
            query_identifier.identifier_query)

        # TODO: parse/error handle this (need paid tier)
        client.query(q)

        return res

    def teardown(self):
        if self._conn is not None and self._close_conn:
            self._conn.close()
