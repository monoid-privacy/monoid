import os
from sys import argv
import sys
from bigquery_lib.bigquery_silo import BigQuerySilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = BigQuerySilo()
    run_query(integration, sys.argv[1:])
    integration.teardown()
