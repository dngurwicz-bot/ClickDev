import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import Client, create_client

# Load .env file from the backend directory
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Supabase clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_api_key = os.getenv("SUPABASE_API_KEY")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not supabase_url or not supabase_api_key:
    raise ValueError("Missing Supabase environment variables")

# Initialize admin client with service role key (bypasses RLS)
try:
    admin_key = supabase_service_role_key or supabase_api_key
    if "PLACEHOLDER" in admin_key:
        raise ValueError("Invalid API Key")
    supabase_admin: Client = create_client(supabase_url, admin_key)
    # Alias for backwards compatibility
    supabase = supabase_admin
except Exception as e:
    print(f"CRITICAL: Failed to create admin client: {e}", flush=True)
    raise
