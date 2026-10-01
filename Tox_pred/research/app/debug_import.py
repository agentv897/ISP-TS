import sys
import os

print("Starting debug...")

print("Appending paths...")
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for path in [ROOT_DIR, os.path.join(ROOT_DIR, "src"), os.path.join(ROOT_DIR, "data")]:
    if path not in sys.path:
        sys.path.append(path)

print("Paths appended. Importing tox_data_engine...")
import src.tox_data_engine
print("Imported tox_data_engine successfully.")

print("Importing toxicity_predictor_gauravvm...")
from src.toxicity_predictor_gauravvm import ToxicityPredictor
print("Imported toxicity_predictor_gauravvm successfully.")
