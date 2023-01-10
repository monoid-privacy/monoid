import os
from sys import argv
import sys
from intercom.intercom_silo import IntercomSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = IntercomSilo()
    run_query(integration, sys.argv[1:])
