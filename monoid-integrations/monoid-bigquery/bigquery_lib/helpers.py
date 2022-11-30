import json
import google.cloud
from typing import Any, Mapping, Optional
from google.cloud import bigquery 
from google.oauth2 import service_account
from monoid_pydev.logger import get_logger

logger = get_logger("bigquery")


def get_connection(conf: Mapping[str, Any], db_name: Optional[str] = None) -> google.cloud.bigquery.client.Client:
    info = json.loads(conf["service_account_json"])
    credentials = service_account.Credentials.from_service_account_info(info)
    client = bigquery.Client(credentials=credentials)
    return client
