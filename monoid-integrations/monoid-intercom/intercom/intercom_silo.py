from enum import Enum
from typing import Any, Mapping, List
from monoid_pydev.silos import AbstractSilo
from monoid_pydev.silos.data_store import DataStore
from monoid_pydev.models import MonoidValidateMessage, Status

from intercom.intercom_store import IntercomDataStore, IntercomContactStore, IntercomConversationStore, IntercomEventStore

class IntercomSilo(AbstractSilo):
    def data_stores(self, conf: Mapping[str, Any]) -> List[DataStore]:
        #         return [MixpanelUserActivityStore(
        #     project_name=conf["project_name"],
        #     project_token=conf["project_token"],
        #     oauth_secret=conf["oauth_secret"], 
        #     project_id=conf["project_id"], 
        #     service_account_username=conf["service_account_username"],
        #     service_account_password=conf["service_account_password"],
        #     api_secret=conf["api_secret"],
        #     store_type=MixpanelStoreType.USER_ACTIVITY
        # ), 
        # MixpanelUserStore(
        # project_name=conf["project_name"],
        # project_token=conf["project_token"],
        # project_id=conf["project_id"], 
        # oauth_secret=conf["oauth_secret"], 
        # service_account_username=conf["service_account_username"],
        # service_account_password=conf["service_account_password"],
        # api_secret=conf["api_secret"],
        # store_type=MixpanelStoreType.USER)]
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