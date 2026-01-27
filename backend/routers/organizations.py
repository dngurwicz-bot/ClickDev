import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies import require_super_admin, log_activity
from schemas import OrganizationCreate, OrganizationResponse, OrganizationSetup

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

def generate_org_number():
    """Generate a unique 5-digit organization number."""
    try:
        # Get the highest existing org_number
        response = supabase_admin.table("organizations")\
            .select("org_number").order("org_number", desc=True)\
            .limit(1).execute()

        if response.data and response.data[0].get("org_number"):
            # Increment the highest number
            max_num = int(response.data[0]["org_number"])
            new_num = max_num + 1
        else:
            # Start from 10000 if no organizations exist
            new_num = 10000

        # Ensure it's 5 digits
        return str(new_num).zfill(5)
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error generating org_number: {e}")
        # Fallback to random 5-digit number
        return str(random.randint(10000, 99999))


@router.get("", response_model=List[OrganizationResponse])
async def get_organizations(_user=Depends(require_super_admin)):
    """List all organizations (Super Admin only)."""
    try:
        response = supabase_admin.table("organizations").select("*")\
            .order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate,
                              user=Depends(require_super_admin)):
    """Create a new organization."""
    try:
        # Auto-generate org_number if not provided
        org_number = org.org_number if org.org_number \
            else generate_org_number()

        # Create organization
        org_data = {
            "name": org.name,
            "name_en": org.name_en,
            "email": org.email,
            "phone": org.phone,
            "address": org.address,
            "active_modules": org.active_modules,
            "subscription_tier_id": org.subscription_tier_id,
            "subscription_tier": org.subscription_tier,
            "logo_url": org.logo_url,
            "org_number": org_number,
            "created_by": user.id
        }

        response = supabase_admin.table("organizations").insert(org_data)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create organization"
            )

        org_id = response.data[0]["id"]

        # Log Activity
        await log_activity(
            user_id=user.id,
            action_type="CREATE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id,
            details={"name": org.name}
        )

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, _user=Depends(require_super_admin)):
    """Get details of a specific organization."""
    try:
        response = supabase_admin.table("organizations")\
            .select("*").eq("id", org_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Organization not found"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(org_id: str, updates: dict,
                              user=Depends(require_super_admin)):
    """Update an organization's details."""
    try:
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table("organizations")\
            .update(updates).eq("id", org_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Organization not found"
            )

        await log_activity(
            user_id=user.id,
            action_type="UPDATE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id,
            details=updates
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{org_id}")
async def delete_organization(org_id: str, user=Depends(require_super_admin)):
    """Delete an organization."""
    try:
        supabase_admin.table("organizations")\
            .delete().eq("id", org_id).execute()

        await log_activity(
            user_id=user.id,
            action_type="DELETE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id
        )

        return {"message": "Organization deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{org_id}/setup")
async def setup_organization(org_id: str, setup: OrganizationSetup,
                             user=Depends(require_super_admin)):
    """Configure organization settings (setup wizard)."""
    try:
        # 1. Fetch current org
        current_org = supabase_admin.table("organizations")\
            .select("*").eq("id", org_id).execute()
        if not current_org.data:
            raise HTTPException(
                status_code=404,
                detail="Organization not found"
            )

        org_data = current_org.data[0]

        # 2. Check Lock
        if org_data.get("config_lock") is True:
            # If requesting to change hierarchy levels, fail
            # Note: We compare lists roughly.
            current_levels = org_data.get("hierarchy_levels") or []
            if setup.hierarchy_levels != current_levels:
                raise HTTPException(
                    status_code=400,
                    detail="Organization Configuration is Locked. "
                           "Cannot change hierarchy levels."
                )

        # 3. Update
        updates = {
            "hierarchy_levels": setup.hierarchy_levels,
            "config_lock": setup.lock_configuration,
            "updated_at": datetime.utcnow().isoformat()
        }

        response = supabase_admin.table("organizations")\
            .update(updates).eq("id", org_id).execute()

        await log_activity(
            user_id=user.id,
            action_type="SETUP_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id,
            details={
                "hierarchy_levels": setup.hierarchy_levels,
                "locked": setup.lock_configuration
            }
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
