#!/bin/bash
set -e

echo "Starting Data Extraction backend on port 8101..."
cd /app/Data_extraction/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8101 &

echo "Starting Toxicity Prediction backend on port 8102..."
cd /app/Tox_pred/research/app
python -m uvicorn api_render:app --host 127.0.0.1 --port 8102 &

echo "Starting Knowledge Graph backend on port 8103..."
cd /app/kg
PORT=8103 python flask_server.py &

echo "Starting Nginx reverse proxy on port 7860..."
nginx -g "daemon off;"
