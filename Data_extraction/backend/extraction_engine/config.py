import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from this file's directory to avoid CWD issues
_config_dir = Path(__file__).resolve().parent
_env_file = _config_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file, override=True)
else:
    load_dotenv()  # fallback to CWD

class Config:
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = (os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT") or "").strip().rstrip("/")
    AZURE_DOCUMENT_INTELLIGENCE_KEY = (os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY") or "").strip()
    
    # Check for specific name first, then fallback to generic
    AZURE_OPENAI_ENDPOINT = (os.getenv("AZURE_OPENAI_ENDPOINT") or os.getenv("OPENAI_API_BASE") or "").strip().rstrip("/")
    # Check multiple variants for the API Key
    AZURE_OPENAI_KEY_RAW = (
        os.getenv("AZURE_OPENAI_API_KEY") or 
        os.getenv("AZURE_OPENAI_KEY") or 
        os.getenv("OPENAI_API_KEY") or ""
    )
    AZURE_OPENAI_KEY = AZURE_OPENAI_KEY_RAW.strip()
    
    AZURE_OPENAI_DEPLOYMENT_NAME = (os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME") or "gpt-4o").strip()
    AZURE_OPENAI_API_VERSION = (os.getenv("AZURE_OPENAI_API_VERSION") or os.getenv("OPENAI_API_VERSION") or "2024-08-01-preview").strip()

    # Optional: separate deployment for extraction (can be gpt-4o-mini, o1-mini, etc.)
    AZURE_OPENAI_EXTRACTION_MODEL = os.getenv(
        "AZURE_OPENAI_EXTRACTION_MODEL",
        os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    )

    # Mini/lightweight model (for routing, classification, compaction)
    AZURE_OPENAI_MINI_DEPLOYMENT = os.getenv("AZURE_OPENAI_MINI_DEPLOYMENT") or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")

    # Batch extraction settings
    EXTRACTION_BATCH_SIZE  = int(os.getenv("EXTRACTION_BATCH_SIZE", "4"))
    EXTRACTION_BATCH_SLEEP = int(os.getenv("EXTRACTION_BATCH_SLEEP", "5"))

    @classmethod
    def validate(cls):
        missing = []
        if not cls.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: missing.append("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
        if not cls.AZURE_DOCUMENT_INTELLIGENCE_KEY: missing.append("AZURE_DOCUMENT_INTELLIGENCE_KEY")
        if not cls.AZURE_OPENAI_ENDPOINT: missing.append("AZURE_OPENAI_ENDPOINT (or OPENAI_API_BASE)")
        if not cls.AZURE_OPENAI_KEY: missing.append("AZURE_OPENAI_API_KEY (or OPENAI_API_KEY)")
        
        # Log sanitized status for debugging in Space logs
        print(f"[DEBUG] Document Intelligence Endpoint: {cls.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT}")
        print(f"[DEBUG] Azure OpenAI Endpoint: {cls.AZURE_OPENAI_ENDPOINT}")
        print(f"[DEBUG] Azure OpenAI Deployment: {cls.AZURE_OPENAI_DEPLOYMENT_NAME}")
        print(f"[DEBUG] Azure OpenAI Version: {cls.AZURE_OPENAI_API_VERSION}")
        if cls.AZURE_OPENAI_KEY:
             print(f"[DEBUG] Azure OpenAI Key: {cls.AZURE_OPENAI_KEY[:4]}...{cls.AZURE_OPENAI_KEY[-4:]}")
        
        if missing:
            raise ValueError(f"Missing environment variables: {', '.join(missing)}")
