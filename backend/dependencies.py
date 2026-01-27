from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import supabase, supabase_admin

security = HTTPBearer()

# Helper function to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Validate Supabase Auth token and return current user.
    """
    try:
        token = credentials.credentials
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.user
    except Exception as e:  # pylint: disable=broad-except
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        ) from e

# Helper function to check super admin
async def require_super_admin(user=Depends(get_current_user)):
    """
    Dependency to ensure the current user has 'super_admin' role.
    """
    response = supabase_admin.table("user_roles").select("*")\
        .eq("user_id", user.id)\
        .eq("role", "super_admin")\
        .execute()
    if not response.data:
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        )
    return user

# Activity Logging Helper
async def log_activity(
    user_id: str,
    action_type: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
    organization_id: Optional[str] = None
):
    """
    Log user activity to the database.
    """
    try:
        if details is None:
            details = {}

        log_data = {
            "user_id": user_id,
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "organization_id": organization_id,
            "created_at": datetime.utcnow().isoformat()
        }
        supabase_admin.table("user_activity_logs").insert(log_data).execute()
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error logging activity: {str(e)}")
