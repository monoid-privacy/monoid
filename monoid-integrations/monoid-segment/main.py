import os
from sys import argv
import sys
from segment_lib.segment_silo import SegmentSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = SegmentSilo()
    run_query(integration, sys.argv[1:])
