import os
from dotenv import load_dotenv
from pathlib import Path

# Load from .env.local first, then fallback to .env
env_path = Path(".env.local")
if not env_path.exists():
    env_path = Path(".env")
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://zojunaebbtymllsaqlme.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
