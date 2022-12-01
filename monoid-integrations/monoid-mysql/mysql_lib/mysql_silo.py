from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import mysql.connector

from mysql_lib.mysql_table import MySQLTableDataStore

class MySQLSilo(AbstractSilo):
    def _get_connection(self, conf: Mapping[str, Any]) -> mysql.connector.MySQLConnection:
        return mysql.connector.MySQLConnection(
          user=conf["username"],
          password=conf["password"],
          database=conf["database"],
          host=conf["hostname"],
          port=conf["port"],
        )

    def _get_database_table_stores(self, db_name: str, conn: mysql.connector.MySQLConnection):
        data_stores = []

        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = '{db_name}';
                """
            )

            for record in cur.fetchall():
                data_stores.append(MySQLTableDataStore(
                    table=record[0],
                    db_name=db_name,
                    conn=conn
                ))

        return data_stores


    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        conn = self._get_connection(conf)
        return self._get_database_table_stores(conf["database"], conn)

    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        try:
            conn = self._get_connection(conf)
        except mysql.connector.Error as e:
            return MonoidValidateMessage(
                status=Status.FAILURE,
                message=f"Something went wrong: {e}"
            )

        conn.close()
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )