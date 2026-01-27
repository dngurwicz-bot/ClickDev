import os
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

# Supabase clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_api_key = os.getenv("SUPABASE_API_KEY")

if not supabase_url or not supabase_api_key:
    raise ValueError("Missing Supabase environment variables")

# Initialize admin client
try:
    if "PLACEHOLDER" in supabase_api_key:
        raise ValueError("Invalid API Key")
    supabase_admin: Client = create_client(supabase_url, supabase_api_key)
    # Alias for backwards compatibility
    supabase = supabase_admin
except Exception as e:
    print(f"CRITICAL: Failed to create admin client: {e}", flush=True)
    raise
