from typing import Any, Mapping, List, Optional
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import google.cloud
from bigquery_lib.helpers import get_connection, logger

from bigquery_lib.bigquery_table import BigQueryTableDataStore


class BigQuerySilo(AbstractSilo):
    def __init__(self):
        self._data_stores: Optional[BigQueryTableDataStore] = None

    def _get_databases(self, conf: Mapping[str, Any]) -> List[str]:
        logger.info("Getting databases")
        client = get_connection(conf)
        datasets = list(client.list_datasets())
        res = [dataset.full_dataset_id for dataset in datasets]
        return res

    def _get_database_table_stores(self, db_name: str, conf: Mapping[str, Any]) -> List[BigQueryTableDataStore]:
        data_stores = []

        logger.info(f"Connecting to {db_name}")

        project, dataset_id = db_name.split(":")

        client = get_connection(conf)
        dataset = client.get_dataset(dataset_id)
        tables = list(client.list_tables(dataset))

        for table in tables:
            data_stores.append(BigQueryTableDataStore(
                table=table.table_id,
                db_name=dataset_id,
                schema=project,
                conf=conf,
                conn=client
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
        except Exception as e:
            return MonoidValidateMessage(
                status=Status.FAILURE,
                message=str(e)
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

        self._data_stores = None
