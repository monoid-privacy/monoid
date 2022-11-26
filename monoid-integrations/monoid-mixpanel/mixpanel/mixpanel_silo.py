from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status
import mysql.connector

from mixpanel.mixpanel_store import MixpanelDataStore

class MixpanelSilo(AbstractSilo):
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        # TODO: Return an single object that conforms to data store
        return [MixpanelDataStore(
            project_name=conf["project_name"],
            project_token=conf["project_token"],
            oauth_token=conf["oauth_token"]
        )]


    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        # TODO: How to validate the project token/GDPR Oauth secret? Make a request? 
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )