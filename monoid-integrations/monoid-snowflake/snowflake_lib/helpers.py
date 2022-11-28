from typing import Any, Mapping, Optional
import snowflake.connector
from monoid_pydev.logger import get_logger

logger = get_logger("postgres")


def get_connection(conf: Mapping[str, Any], db_name: Optional[str] = None):
    if db_name is None:
        db_name = conf["database"]

    return snowflake.connector.connect(
        user=conf["username"],
        password=conf["password"],
        account=conf["account"],
        warehouse=conf["warehouse"],
        database=db_name,
    )
