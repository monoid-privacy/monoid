import os
from sys import argv
import sys
from postgres.postgres_silo import PostgresSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = PostgresSilo()
    run_query(integration, sys.argv[1:])
    integration.teardown()
