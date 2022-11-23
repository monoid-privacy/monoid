import logging
from typing import Optional

from monoid_pydev.models.models import MonoidLogMessage, MonoidMessage


def get_logger(name: Optional[str] = None):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(MonoidFormatter())

    logger.addHandler(stream_handler)

    return logger


class MonoidFormatter(logging.Formatter):
    """
    Converts log messages into MonoidMessage json objects.
    """

    # Transforming Python log levels to Airbyte protocol log levels
    level_mapping = {
        logging.FATAL: "FATAL",
        logging.ERROR: "ERROR",
        logging.WARNING: "WARN",
        logging.INFO: "INFO",
        logging.DEBUG: "DEBUG",
    }

    def format(self, record) -> str:
        level = self.level_mapping.get(record.levelno, "INFO")
        message = super().format(record)
        return MonoidMessage(
            type="LOG",
            log=MonoidLogMessage(
                message=message
            )
        ).json()
