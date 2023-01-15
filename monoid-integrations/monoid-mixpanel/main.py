import os
from sys import argv
import sys
from mixpanel.mixpanel_silo import MixpanelSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = MixpanelSilo()
    run_query(integration, sys.argv[1:])
