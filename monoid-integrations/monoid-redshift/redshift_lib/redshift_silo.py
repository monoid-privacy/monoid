from typing import Any, Mapping, List, Optional
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import redshift_connector
from redshift_lib.helpers import get_connection, logger

from redshift_lib.redshift_table import RedshiftTableDataStore


class RedshiftSilo(AbstractSilo):
    def __init__(self):
        self._data_stores: Optional[RedshiftTableDataStore] = None
        self._conns: List[redshift_connector.Connection] = []

    def _get_databases(self, conf: Mapping[str, Any]) -> List[str]:
        res = []

        logger.info("Getting databases")

        with get_connection(conf) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT datname FROM pg_database
                        WHERE datistemplate = false;
                    """
                )

                for record in cur.fetchall():
                    if record[0] not in conf.get("exclude_dbs", []):
                        res.append(record[0])

            logger.info(f"Found {len(res)} databases")
            return res

    def _get_database_table_stores(self, db_name: str, conf: Mapping[str, Any]) -> List[RedshiftTableDataStore]:
        data_stores = []

        logger.info(f"Connecting to {db_name}")

        conn = get_connection(conf, db_name)
        self._conns.append(conn)

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public';
                """
            )

            for record in cur.fetchall():
                data_stores.append(RedshiftTableDataStore(
                    table=record[0],
                    db_name=db_name,
                    schema='public',
                    conf=conf,
                    conn=conn
                ))

        return data_stores

    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        if self._data_stores is None:
            databases = self._get_databases(conf)
            self._data_stores = [
                store for db in databases for store in self._get_database_table_stores(db, conf)]

        return self._data_stores

    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        try:
            conn = get_connection(conf)
        except redshift_connector.OperationalError as e:
            return MonoidValidateMessage(
                status=Status.FAILURE,
                message=str(e).decode('utf-8')
            )

        conn.close()
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )

    def teardown(self):
        if self._data_stores is None:
            return

        for d in self._data_stores:
            d.teardown()

        for c in self._conns:
            c.close()

        self._conns = []
        self._data_stores = None
