import os
from sys import argv
import sys
from amplitude.amplitude_silo import AmplitudeSilo
from monoid_pydev.runner import run_query

if __name__ == "__main__":
    integration = AmplitudeSilo()
    run_query(integration, sys.argv[1:])
