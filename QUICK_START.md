# Translational Safety Platform

### Complete 3-Module Biomedical Research Solution

- **Data Extraction Module** - AI-powered document parsing and clinical data extraction
- **Toxicity Prediction Module** - ML-based toxicity endpoint prediction and Bayesian risk scoring
- **Knowledge Graph Module** - Interactive drug-target-pathway knowledge graph visualization

---

## Quick Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Set Up Python Virtual Environment
``powershell
python -m venv venv_suneel
.\venv_suneel\Scripts\Activate.ps1
pip install -r requirements.txt
``

### Step 2: Set Up Frontend Dependencies
``powershell
cd frontend
npm install
cd ..
``

### Step 3: Run the Complete Platform
``powershell
.\run_portal_suneel_new.ps1
``

### Service Ports

| Module                | Port | URL                              |
|-----------------------|------|----------------------------------|
| Unified Frontend      | 5190 | http://localhost:5190            |
| Data Extraction API   | 8201 | http://localhost:8201/api/health |
| Toxicity Prediction   | 8202 | http://localhost:8202/api/health |
| Knowledge Graph API   | 8203 | http://localhost:8203/           |

