from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import psycopg

from postgres.postgres_table import PostgresTableDataStore


class PostgresSilo(AbstractSilo):
    def _get_connection(self, conf: Mapping[str, Any]) -> psycopg.Connection:
        connection_str = [
            f'host={conf["hostname"]}',
            f'port={conf["port"]}',
            f'dbname={conf["database"]}',
            f'user={conf["username"]}',
            f'password={conf["password"]}'
        ]

        if conf.get("ssl", False):
            connection_str.append("sslmode=prefer")
        else:
            connection_str.append("sslmode=disable")

        return psycopg.connect(" ".join(connection_str))

    def _get_database_table_stores(self, db_name: str, conn: psycopg.Connection) -> List[DataStore]:
        data_stores = []

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public';
                """
            )

            for record in cur.fetchall():
                data_stores.append(PostgresTableDataStore(
                    table=record[0],
                    db_name=db_name,
                    schema='public',
                    conn=conn
                ))

        return data_stores

    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        conn = self._get_connection(conf)
        return self._get_database_table_stores(conf["database"], conn)

    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        try:
            conn = self._get_connection(conf)
        except psycopg.OperationalError as e:
            return MonoidValidateMessage(
                status=Status.FAILURE,
                message=e.pgconn.error_message.decode('utf-8')
            )

        conn.close()
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )
