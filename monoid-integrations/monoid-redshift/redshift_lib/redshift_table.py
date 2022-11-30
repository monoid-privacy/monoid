import base64
from unicodedata import name
from monoid_pydev.silos.db_data_store import DBDataStore
import redshift_connector
from monoid_pydev.models import MonoidRecord, MonoidQueryIdentifier, MonoidSchema, MonoidPersistenceConfig
from typing import Any, Dict, Iterable, Mapping, Optional
from pypika import Table, Query, Field

from redshift_lib.helpers import get_connection, logger


def type_to_jsonschema(redshift_type: str) -> Optional[str]:
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

    comp_type = redshift_type.lower()

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


class RedshiftTableDataStore(DBDataStore):
    def __init__(
        self,
        table: str,
        db_name: str,
        schema: str,
        conf: Mapping[str, any],
        conn: Optional[redshift_connector.Connection] = None
    ):
        self.conf = conf
        self.table = table
        self.db_name = db_name
        self.schema = schema
        self._conn = conn
        self._close_conn = True

        if conn is not None:
            self._close_conn = False

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

        with self._get_connection().cursor() as cur:
            cur.execute(
                f"""
                SELECT column_name, udt_name
                    FROM information_schema.columns
                    WHERE table_schema = '{self.schema}'
                    AND table_name   = '{self.table}';
                """
            )

            for r in cur.fetchall():
                js_type = type_to_jsonschema(r[1])
                if js_type is not None:
                    schema["properties"][r[0]] = {
                        "type": js_type
                    }

        return schema

    def query_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        query_cols = [f for f in query_identifier.json_schema["properties"]]

        logger.info(
            f"Querying records from table {self.group()}.{self.name()}")

        with self._get_connection().cursor() as cur:
            tbl = Table(self.table, schema=self.schema)
            q = Query.from_(tbl).select(
                *query_cols).where(
                    Field(query_identifier.identifier) ==
                query_identifier.identifier_query)

            cur.execute(str(q))

            for r in cur:
                yield MonoidRecord(
                    schema_name=self.name(),
                    schema_group=self.group(),
                    data={
                        q: serializable_val(r[i]) for i, q in enumerate(query_cols)
                    }
                )

    def scan_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        schema: MonoidSchema
    ) -> Iterable[MonoidRecord]:
        query_cols = [f for f in schema.json_schema["properties"]]

        logger.info(
            f"Sampling records from table {self.group()}.{self.name()}")

        with self._get_connection().cursor() as cur:
            tbl = Table(self.table, schema=self.schema)
            q = Query.from_(tbl).select(*query_cols).limit(5)
            cur.execute(str(q))

            for r in cur:
                # TODO: Do more sophisticated transformation
                yield MonoidRecord(
                    schema_name=self.name(),
                    schema_group=self.group(),
                    data={
                        q: serializable_val(r[i]) for i, q in enumerate(query_cols)
                    }
                )

    def delete_records(
        self,
        persistence_conf: MonoidPersistenceConfig,
        query_identifier: MonoidQueryIdentifier
    ) -> Iterable[MonoidRecord]:
        res = [q for q in self.query_records(persistence_conf, query_identifier)]

        logger.info(
            f"Deleting records from table {self.group()}.{self.name()}")

        conn = self._get_connection()
        with conn.cursor() as cur:
            tbl = Table(self.table, schema=self.schema)
            q = Query.from_(tbl).delete().where(
                Field(query_identifier.identifier) ==
                query_identifier.identifier_query)
            logger.info(str(q))
            cur.execute(str(q))
            conn.commit()

        return res

    def teardown(self):
        if self._conn is not None and self._close_conn:
            self._conn.close()
