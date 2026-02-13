from supabase import Client, create_client

from app.core.config import settings


def get_service_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service client is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
