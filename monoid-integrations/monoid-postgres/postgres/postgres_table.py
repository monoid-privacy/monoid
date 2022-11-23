import base64
from unicodedata import name
from monoid_pydev.silos.db_data_store import DBDataStore
import psycopg
from monoid_pydev.models import MonoidRecord, MonoidQueryIdentifier, MonoidSchema, MonoidPersistenceConfig
from typing import Any, Dict, Iterable, Mapping, Optional
from pypika import Table, Query, Field

from postgres.helpers import get_connection, logger


def type_to_jsonschema(pg_type: str) -> Optional[str]:
    if (
        pg_type == "int" or
        pg_type == "integer" or
        pg_type == "int8" or
        pg_type == "int2" or
        pg_type == "int4" or
        pg_type == "smallint" or
        pg_type == "bigint"
    ):
        return "integer"
    elif (
        pg_type == "decimal" or
        pg_type == "numeric" or
        pg_type == "real" or
        pg_type == "double precision"
    ):
        return "number"
    elif (
        pg_type == "text" or
        pg_type == "timestamptz"
    ):
        return "string"
    elif (
        pg_type == "bytea"
    ):
        return "string"

    return None


# TODO: Make this more comprehensive
def serializable_val(val: Any) -> Any:
    if isinstance(val, (bytes, bytearray)):
        return base64.b64encode(val).decode('utf-8')

    return val


class PostgresTableDataStore(DBDataStore):
    def __init__(
        self,
        table: str,
        db_name: str,
        schema: str,
        conf: Mapping[str, any],
        conn: Optional[psycopg.Connection] = None
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
        query_identifier: MonoidQueryIdentifier,
        persistence_conf: MonoidPersistenceConfig
    ) -> Iterable[MonoidRecord]:
        res = [q for q in self.query_records(query_identifier)]

        logger.info(
            f"Deleting records from table {self.group()}.{self.name()}")

        with self._get_connection().cursor() as cur:
            tbl = Table(self.table, schema=self.schema)
            q = Query.from_(tbl).delete().where(
                Field(query_identifier.identifier) ==
                query_identifier.identifier_query)
            cur.execute(str(q))

        return res

    def teardown(self):
        if self._conn is not None and self._close_conn:
            self._conn.close()
