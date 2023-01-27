import os
from sys import argv
import sys
from mariadb_lib.mariadb_silo import MariaDBSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = MariaDBSilo()
    run_query(integration, sys.argv[1:])
