---
title: Toxs
emoji: 🌖
colorFrom: gray
colorTo: pink
sdk: docker
pinned: false
---

# AViiD Unified Portal — Developer Onboarding Guide

Welcome to the AViiD Unified Platform. This document outlines the exact steps to install and run the full stack locally for development.

## 1. Prerequisites

- **Node.js** (v18+) & **npm**
- **Python** (3.10 or 3.11 recommended)
- **PowerShell** (Windows)

## 2. Directory Structure

The repository is modularized into three core pieces:
1. `frontend/` — The unified React application built with Vite and TailwindCSS.
2. `Data_extraction/backend/` — FastAPI pipeline for automated data layout mapping.
3. `Tox_pred/research/app/` — FastAPI engine for Bayesian toxicity and FAERS cross-matching.

---

## 3. Installation Guide

Open your terminal in this root directory (`AViiD_Portal`).

### Step A: Setup the Frontend (React + Vite)
```powershell
cd frontend
npm install
cd ..
```

### Step B: Setup the Backend Python Environment
It is **highly recommended** to isolate dependencies in a virtual environment.

```powershell
# 1. Create a virtual environment
python -m venv venv

# 2. Activate it (PowerShell)
.\venv\Scripts\activate

# 3. Install Data Extraction backend requirements
pip install -r Data_extraction/backend/requirements.txt

# 4. Install Toxicity backend requirements
pip install -r Tox_pred/research/requirements.txt

# Note: The toxicity AI engine strictly requires numpy<2 and scikit-learn<1.5 to maintain pandas compatibility.
```

---

## 4. Running the Platform

Once `npm install` and `pip install` are completed, you **do not** need to start services manually. We use a unified automation script that bootstraps the entire platform.

```powershell
# Make sure you are in the root directory (where this README is)
.\run_portal.ps1
```

**What this script does:**
1. Launches the Data Extraction API on **port 8101**.
2. Launches the Toxicity Prediction API on **port 8102**.
3. Starts the unified Vite frontend server on **port 5180**.
4. Proxies all `/api/extraction/*` and `/api/tox/*` requests seamlessly so you don't face CORS issues.

Access the platform at: 👉 **http://localhost:5180**

---

### Troubleshooting

- **`No module named 'azure'` / `'sklearn'`**: Your Python environment isn't activated. Be sure `(venv)` appears in your terminal prompt, or run `pip install scikit-learn<1.5 numpy<2 azure-ai-documentintelligence` manually to hotfix it.
- **Port already in use**: If a background Python process didn't close cleanly, open Task Manager and terminate `python.exe` processes.

---

## 🚀 Deployment to Hugging Face Spaces

This portal is optimized for Hugging Face Spaces using Docker.

1. **Create a New Space**: Select **Docker** as the SDK.
2. **Secrets & Variables Configuration**: Go to your Space **Settings > Variables and secrets** and add the following:

> [!IMPORTANT]
> **Endpoint URLs**: Ensure endpoints (like `OPENAI_API_BASE`) do **NOT** have a trailing slash (e.g., use `https://xyz.openai.azure.com` instead of `https://xyz.openai.azure.com/`).

| Name | Type | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | **Secret** | Your Azure OpenAI API Key |
| `OPENAI_API_BASE` | Variable | Your Azure OpenAI Endpoint URL (No trailing slash) |
| `OPENAI_API_VERSION` | Variable | e.g., `2024-02-15-preview` |
| `AZURE_DEPLOYMENT_NAME` | Variable | Your GPT-4o deployment name |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Variable | Your Doc Intelligence Endpoint (No trailing slash) |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | **Secret** | Your Doc Intelligence API Key |
| `SPANNER_PROJECT_ID` | Variable | `Life-Sciences-AI-POC` |
| `SPANNER_INSTANCE_ID` | Variable | `demofactory` |
| `SPANNER_DATABASE_ID` | Variable | `life_sciences_kg` |
| `GOOGLE_CLOUD_PROJECT` | Variable | `Life-Sciences-AI-POC` |
| `QUOTA_PROJECT_ID` | Variable | `Life-Sciences-AI-POC` |

3. **Environment**: The `Dockerfile` will automatically build the React frontend and orchestrate the three Python backends via Nginx on port `7860`.

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference
