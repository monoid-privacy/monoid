from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import mariadb

from mariadb_lib.mariadb_table import MariaDBTableDataStore

class MariaDBSilo(AbstractSilo):
    def _get_connection(self, conf: Mapping[str, Any]) -> mariadb.connection:
        return mariadb.connect(
          user=conf["username"],
          password=conf["password"],
          database=conf["database"],
          host=conf["hostname"],
          port=conf["port"],
        )

    def _get_database_table_stores(self, db_name: str, conn: mariadb.connection):
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
                data_stores.append(MariaDBTableDataStore(
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
        except mariadb.Error as e:
            return MonoidValidateMessage(
                status=Status.FAILURE,
                message=f"Something went wrong: {e}"
            )

        conn.close()
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )
