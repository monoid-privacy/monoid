import os
from sys import argv
import sys
from redshift_lib.redshift_silo import RedshiftSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = RedshiftSilo()
    run_query(integration, sys.argv[1:])
    integration.teardown()
