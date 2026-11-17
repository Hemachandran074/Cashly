from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Returns an initialized Supabase client using Service Role Key (preferred for backend)
    or Anon Key.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    # Prefer service-role key for backend operations; fallback to anon key
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not url or not key:
        raise ValueError(
            "Supabase client cannot be initialized: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set in .env"
        )

    _supabase_client = create_client(url, key)
    return _supabase_client

