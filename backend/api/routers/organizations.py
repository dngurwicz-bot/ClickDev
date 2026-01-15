from fastapi import APIRouter, HTTPException, Depends
from typing import List
from api.models import OrganizationCreate, OrganizationResponse
from api.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.get("/", response_model=List[OrganizationResponse])
async def get_organizations(supabase: Client = Depends(get_supabase_client)):
    """Get all organizations"""
    try:
        response = supabase.table("organizations").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch organizations: {str(e)}")

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get organization by ID"""
    try:
        response = supabase.table("organizations").select("*").eq("id", org_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        return response.data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch organization: {str(e)}")

@router.post("/", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate, supabase: Client = Depends(get_supabase_client)):
    """Create a new organization"""
    try:
        response = supabase.table("organizations").insert(org.dict()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create organization")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create organization: {str(e)}")

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    org: OrganizationCreate,
    supabase: Client = Depends(get_supabase_client)
):
    """Update an organization"""
    try:
        response = supabase.table("organizations").update(org.dict()).eq("id", org_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to update organization: {str(e)}")

@router.delete("/{org_id}")
async def delete_organization(org_id: str, supabase: Client = Depends(get_supabase_client)):
    """Delete an organization"""
    try:
        response = supabase.table("organizations").delete().eq("id", org_id).execute()
        return {"message": "Organization deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete organization: {str(e)}")
