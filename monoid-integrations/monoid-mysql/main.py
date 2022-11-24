import os
from sys import argv
import sys
from mysql_lib.mysql_silo import MySQLSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = MySQLSilo()
    run_query(integration, sys.argv[1:])
