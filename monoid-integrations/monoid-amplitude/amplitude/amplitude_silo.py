from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status

from amplitude.amplitude_store import AmplitudeDataStore

class AmplitudeSilo(AbstractSilo):
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        # TODO: Return an single object that conforms to data store
        return [AmplitudeDataStore(
            secret_key=conf["secret_key"],
            project_name=conf["project_name"],
            start_date=conf["start_data"],
            owner_email=conf["owner_email"], 
            api_key=conf["api_key"],
        )]


    def validate(self, conf: Mapping[str, Any]) -> MonoidValidateMessage:
        # TODO: How to validate the project token/GDPR Oauth secret? Make a request? 
        return MonoidValidateMessage(
            status=Status.SUCCESS
        )