import os
from sys import argv
import sys
from snowflake_lib.snowflake_silo import SnowflakeSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = SnowflakeSilo()
    run_query(integration, sys.argv[1:])
    integration.teardown()
