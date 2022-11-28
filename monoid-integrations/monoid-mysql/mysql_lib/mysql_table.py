import base64
from unicodedata import name
import mysql.connector
from monoid_pydev.silos.db_data_store import DBDataStore
from monoid_pydev.models import MonoidRecord, MonoidQueryIdentifier, MonoidSchema
from typing import Any, Dict, Iterable, Optional
from pypika import Table, Query, Field


def type_to_jsonschema(mysql_type: str) -> Optional[str]:
    int_types = [
      "int", 
      "integer", 
      "mediumint",
      "smallint", 
      "tinyint", 
      "bigint", 
    ]

    number_types = [
      "decimal", 
      "numeric", 
      "float", 
      "double", 
      "real", 
      "double precision",
    ]

    time_types = [
      "date", 
      "time", 
      "datetime", 
      "timestamp", 
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
      "mediumblob",
      "longblob",
      "enum",
      "set",
      "binary",
      "varbinary",
    ]

    if mysql_type in int_types:
        return "integer"
    elif mysql_type in number_types:
        return "number"
    elif (mysql_type in string_types) or (mysql_type in time_types):
        return "string"
    return None


# TODO: Make this more comprehensive
def serializable_val(val: Any) -> Any:
    if isinstance(val, (bytes, bytearray)):
        return base64.b64encode(val).decode('utf-8')

    return val


class MySQLTableDataStore(DBDataStore):
    def __init__(self, table: str, db_name: str, conn: mysql.connector.MySQLConnection):
        self.conn = conn
        self.table = table
        self.db_name = db_name

    def name(self):
        return self.table

    def group(self):
        return f"{self.db_name}"

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
                SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = '{self.db_name}'
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
            tbl = Table(self.table)
            q = Query.from_(tbl).select(
                *query_cols).where(
                    Field(query_identifier.identifier) ==
                query_identifier.identifier_query).get_sql(quote_char=None)

            cur.execute(str(q))

            for r in cur:
                yield MonoidRecord(
                    schema_name=self.name(),
                    schema_group=self.group(),
                    data={
                        q: serializable_val(r[i]) for i, q in enumerate(query_cols)
                    }
                )

    def scan_records(self, schema: MonoidSchema) -> Iterable[MonoidRecord]:
        query_cols = [f for f in schema.json_schema["properties"]]

        with self.conn.cursor() as cur:
            tbl = Table(self.table)
            q = Query.from_(tbl).select(*query_cols).limit(5).get_sql(quote_char=None)
            print(str(q))
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

    def delete_records(self, query_identifier: MonoidQueryIdentifier) -> Iterable[MonoidRecord]:
        res = [q for q in self.query_records(query_identifier)]
        with self.conn.cursor() as cur:
            tbl = Table(self.table)
            q = Query.from_(tbl).delete().where(
                Field(query_identifier.identifier) ==
                query_identifier.identifier_query).get_sql(quote_char=None)
            cur.execute(str(q))

        return res

    def teardown(self):
        if self._conn is not None and self._close_conn:
            self._conn.close()