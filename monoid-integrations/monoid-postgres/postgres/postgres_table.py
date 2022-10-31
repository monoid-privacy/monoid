import base64
from unicodedata import name
from monoid_pydev.silos.data_store import DataStore
import psycopg
from monoid_pydev.models import MonoidRecord, MonoidQueryIdentifier, MonoidSchema
from typing import Any, Dict, Iterable, Optional


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


class PostgresTableDataStore(DataStore):
    def __init__(self, table: str, db_name: str, schema: str, conn: psycopg.Connection):
        self.conn = conn
        self.table = table
        self.db_name = db_name
        self.schema = schema

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

        with self.conn.cursor() as cur:
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

    def query_records(self, query_identifier: MonoidQueryIdentifier) -> Iterable[MonoidRecord]:
        query_cols = [f for f in query_identifier.json_schema["properties"]]

        with self.conn.cursor() as cur:
            q = str(query_identifier.identifier_query)
            if isinstance(query_identifier.identifier_query, str):
                q = f"'{q}'"

            cur.execute(
                f"""
                SELECT {",".join(query_cols)}
                    FROM {self.schema}.{self.table}
                    WHERE {query_identifier.identifier} = {q}
                """
            )

            for r in cur:
                yield MonoidRecord(
                    schema_name=self.name(),
                    schema_group=self.group(),
                    data={
                        q: serializable_val(r[i]) for i, q in enumerate(query_cols)
                    }
                )

    def sample_records(self, schema: MonoidSchema) -> Iterable[MonoidRecord]:
        query_cols = [f for f in schema.json_schema["properties"]]

        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT {",".join(query_cols)}
                    FROM {self.schema}.{self.table}
                    LIMIT 5;
                """
            )

            for r in cur:
                # TODO: Do more sophisticated transformation
                yield MonoidRecord(
                    schema_name=self.name(),
                    schema_group=self.group(),
                    data={
                        q: serializable_val(r[i]) for i, q in enumerate(query_cols)
                    }
                )

    def delete_records(self, query_identifier: MonoidQueryIdentifier) -> Iterable[MonoidRecord]:
        res = [q for q in self.query_records(query_identifier)]
        with self.conn.cursor() as cur:
            q = str(query_identifier.identifier_query)
            if isinstance(query_identifier.identifier_query, str):
                q = f"'{q}'"

            cur.execute(
                f"""
                DELETE
                    FROM {self.schema}.{self.table}
                    WHERE {query_identifier.identifier} = {q}
                """
            )

        return res
