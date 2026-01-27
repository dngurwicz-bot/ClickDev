from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin, supabase
from dependencies import require_super_admin, log_activity
from schemas import UserInvite, UserUpdate


"""
Users Router
Handles user invitations, updates, and deletion.
"""

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("")
async def get_all_users(_user=Depends(require_super_admin)):
    """List all users (securely)."""
    try:
        # Option 1: Direct SQL Query via RPC
        response = supabase_admin.rpc("get_all_users_secure", {}).execute()
        if not response.data:
            return []

        # Transform data to match frontend expectations if needed
        return response.data

    except Exception as e:  # pylint: disable=broad-except
        print(f"Error fetching users: {str(e)}")
        # Temporary: return empty list to avoid 500
        return []


@router.post("")
async def invite_user(invite: UserInvite, user=Depends(require_super_admin)):
    """Invite a new user."""
    try:
        # 1. Invite user in Supabase Auth (sends email)
        auth_response = supabase_admin.auth.admin.invite_user_by_email(
            invite.email,
            options={
                "data": {
                    "first_name": invite.first_name,
                    "last_name": invite.last_name,
                    "organization_id": invite.organization_id
                }
            }
        )
        new_user = auth_response.user

        if not new_user:
            raise HTTPException(
                status_code=400,
                detail="Failed to invite user"
            )

        # 2. Assign Role in user_roles table
        role_data = {
            "user_id": new_user.id,
            "role": invite.role,
            "organization_id": invite.organization_id
        }

        role_response = supabase_admin.table("user_roles")\
            .insert(role_data).execute()

        if not role_response.data:
            # Rollback?
            supabase_admin.auth.admin.delete_user(new_user.id)
            raise HTTPException(
                status_code=400,
                detail="Failed to assign role"
            )

        await log_activity(
            user_id=user.id,
            action_type="INVITE_USER",
            entity_type="USER",
            entity_id=new_user.id,
            details={
                "email": invite.email,
                "role": invite.role,
                "organization_id": invite.organization_id
            },
            organization_id=invite.organization_id
        )

        return {"message": "User invited successfully", "user_id": new_user.id}

    except Exception as e:  # pylint: disable=broad-except
        print(f"Error inviting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{user_id}")
async def delete_user(user_id: str, _user=Depends(require_super_admin)):
    """Delete a user."""
    try:
        # 0. Cleanup dependencies manually
        supabase_admin.table("user_roles").delete()\
            .eq("user_id", user_id).execute()
        supabase_admin.table("admin_tasks").delete()\
            .eq("assigned_to", user_id).execute()
        supabase_admin.table("admin_tasks").delete()\
            .eq("created_by", user_id).execute()

        # 1. Delete from Auth (Primary)
        supabase_admin.auth.admin.delete_user(user_id)

        return {"message": "User deleted successfully"}
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{user_id}")
async def update_user(user_id: str, updates: UserUpdate,
                      _user=Depends(require_super_admin)):
    """Update a user's details."""
    try:
        # 1. Update Auth Metadata (Name)
        meta_updates = {}
        if updates.first_name:
            meta_updates["first_name"] = updates.first_name
        if updates.last_name:
            meta_updates["last_name"] = updates.last_name

        if meta_updates:
            supabase_admin.auth.admin.update_user_by_id(
                user_id,
                {"user_metadata": meta_updates}
            )

        # 2. Update Role/Org
        if updates.role or updates.organization_id:
            # Delete existing
            supabase_admin.table("user_roles").delete()\
                .eq("user_id", user_id).execute()

            # Insert new
            role_data = {
                "user_id": user_id,
                "role": updates.role,
                "organization_id": updates.organization_id
            }
            # Handle None for organization_id if super_admin
            supabase_admin.table("user_roles").insert(role_data).execute()

        return {"message": "User updated successfully"}
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{user_id}/reset-password")
async def reset_password(user_id: str, _user=Depends(require_super_admin)):
    """Trigger a password reset for a user."""
    try:
        # Get user email
        user_response = supabase_admin.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")

        email = user_response.user.email

        # Using sending the recovery email via auth api
        supabase.auth.reset_password_email(email)

        return {"message": "Password reset email sent successfully"}
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error sending reset password email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e

@router.get("/activity-logs/{user_id}")
async def get_user_activity_logs(user_id: str,
                                 _user=Depends(require_super_admin)):
    """
    Retrieve recent activity logs for a specific user.
    """
    try:
        response = supabase_admin.table("user_activity_logs")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
