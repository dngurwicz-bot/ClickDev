from supabase import create_client, Client
from api.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

def get_supabase_client() -> Client:
    """Create and return a Supabase client with service role key"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
