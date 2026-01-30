"""
Dependencies for authentication and authorization.
"""
import os
from datetime import datetime
from typing import Optional

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


from database import supabase_admin  # pylint: disable=import-error

security = HTTPBearer()


# Helper function to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Validate Supabase Auth token by calling Supabase's auth endpoint.
    """
    try:
        token = credentials.credentials
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_API_KEY", "")

        if not supabase_url or not supabase_key:
            print("[AUTH ERROR] Missing Supabase credentials")
            raise HTTPException(
                status_code=500, detail="Server configuration error"
            )

        # Call Supabase's auth endpoint to validate the token
        # This endpoint returns user info if token is valid
        auth_url = f"{supabase_url}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": supabase_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(auth_url, headers=headers, timeout=5.0)

        if response.status_code == 200:
            user_data = response.json()
            user_id = user_data.get("id")
            email = user_data.get("email", "unknown")

            print(f"[AUTH] Token validated for: {email} (ID: {user_id})")

            # Create a combined user object with token
            class User:
                """User object."""
                def __init__(self, user_id, email, token):
                    self.id = user_id
                    self.email = email
                    self.token = token

            return User(user_id=user_id, email=email, token=token)
        else:
            print(f"[AUTH] Token validation failed: {response.status_code}")
            raise HTTPException(
                status_code=401, detail="Invalid or expired token"
            )

    except httpx.RequestError as e:
        print(f"[AUTH ERROR] Connection error to Supabase: {str(e)}")
        raise HTTPException(
            status_code=401, detail="Authentication service unavailable"
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH ERROR] Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        ) from e


# Helper function to check super admin
async def require_super_admin(user=Depends(get_current_user)):
    """
    Dependency to ensure the current user has 'super_admin' role.
    """
    print(f"[AUTH DEBUG] Checking super_admin for: {user.email} ({user.id})")

    try:
        # Use admin client to check user roles (bypasses RLS for role verification)
        response = supabase_admin.table("user_roles").select("*")\
            .eq("user_id", user.id)\
            .eq("role", "super_admin")\
            .execute()

        print(f"[AUTH DEBUG] DB Response: {response.data}")

        if not response.data:
            print(f"[AUTH DEBUG] Denied: {user.email} not super_admin")
            raise HTTPException(
                status_code=403,
                detail="Super admin access required"
            )

        print(f"[AUTH DEBUG] Access Granted: {user.email} is super_admin")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH DEBUG] Error querying user_roles: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        ) from e


# Helper function to check admin (super_admin or organization_admin)
async def require_admin(user=Depends(get_current_user)):
    """
    Dependency to ensure user has 'super_admin' or 'organization_admin' role.
    """
    try:
        # Use admin client to check user roles (bypasses RLS for role verification)
        response = supabase_admin.table("user_roles").select("*")\
            .eq("user_id", user.id)\
            .in_("role", ["super_admin", "organization_admin"])\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        ) from e


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
