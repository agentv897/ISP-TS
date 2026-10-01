# AlphaTox Intelligence Hub — Multi-service Dockerfile for Hugging Face Spaces

# Stage 1: Build the Frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Production Image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libxrender1 \
    libxext6 \
    libfontconfig1 \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Final image setup
# Environment variables should be configured as Secrets/Variables in Hugging Face Spaces.
# See README.md for the list of required variables.

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code
COPY . .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Setup Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Pre-ingest Toxicity models to optimize startup
RUN PYTHONPATH=$PYTHONPATH:/app/Tox_pred/research/src:/app/Tox_pred/research python Tox_pred/research/pre_ingest.py

# Expose the mandatory Hugging Face port
EXPOSE 7860

# Entrypoint script to start multiple backends + nginx
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
