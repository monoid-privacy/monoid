from enum import Enum
from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import mysql.connector

from segment.segment_store import SegmentDataStore

class SegmentStoreType(Enum):
    USER = 'USER'
    USER_ACTIVITY = 'USER_ACTIVITY'

class SegmentSilo(AbstractSilo):
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        return SegmentDataStore(
            api_key=conf["api_key"],
            workspace_id=conf["workspace_id"]
        )


    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        # TODO: How to validate the project token/GDPR Oauth secret? Make a request? 
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )