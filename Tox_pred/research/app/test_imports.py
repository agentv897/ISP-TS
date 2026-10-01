import sys

print("Testing numpy import...")
sys.stdout.flush()
import numpy as np
print(f"Numpy imported: {np.__version__}")
sys.stdout.flush()

print("Testing pandas import...")
sys.stdout.flush()
import pandas as pd
print(f"Pandas imported: {pd.__version__}")
sys.stdout.flush()
