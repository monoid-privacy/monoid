from enum import Enum
from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status

from intercom.intercom_store import IntercomDataStore, IntercomContactStore, IntercomConversationStore, IntercomEventStore

class IntercomSilo(AbstractSilo):
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        return [IntercomContactStore(
            access_token=conf["access_token"], 
            workspace=conf["workspace"]), 
            IntercomConversationStore(
                access_token=conf["access_token"],
                workspace=conf["workspace"]),
            IntercomEventStore(
                access_token=conf["access_token"],
                workspace=conf["workspace"])]


    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )