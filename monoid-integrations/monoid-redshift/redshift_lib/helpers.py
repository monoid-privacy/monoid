from typing import Any, Mapping, Optional
import redshift_connector
from monoid_pydev.logger import get_logger

logger = get_logger("redshift")


def get_connection(conf: Mapping[str, Any], db_name: Optional[str] = None) -> redshift_connector.Connection:
    if db_name is None:
        db_name = conf["database"]

    return redshift_connector.connect(
        user=conf["username"],
        password=conf["password"],
        host=conf["host"],
        database=db_name,
    )
