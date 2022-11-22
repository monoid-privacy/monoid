from typing import Any, Mapping, Optional
import psycopg
from monoid_pydev.logger import get_logger

logger = get_logger("postgres")


def get_connection(conf: Mapping[str, Any], db_name: Optional[str] = None) -> psycopg.Connection:
    if db_name is None:
        db_name = conf["database"]

    connection_str = [
        f'host={conf["hostname"]}',
        f'port={conf["port"]}',
        f'dbname={db_name}',
        f'user={conf["username"]}',
        f'password={conf["password"]}'
    ]

    if conf.get("ssl", False):
        connection_str.append("sslmode=prefer")
    else:
        connection_str.append("sslmode=disable")

    return psycopg.connect(" ".join(connection_str))
