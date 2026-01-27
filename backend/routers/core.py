from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies import require_super_admin
from schemas import (
    JobGradeCreate, JobTitleCreate, OrgUnitCreate, PositionCreate
)

router = APIRouter(tags=["Core"])

# Job Grades
@router.get("/api/organizations/{org_id}/job-grades")
async def get_job_grades(org_id: str, _user=Depends(require_super_admin)):
    """List job grades for an organization."""
    try:
        response = supabase_admin.table("job_grades").select("*")\
            .eq("organization_id", org_id).order("level").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/organizations/{org_id}/job-grades")
async def create_job_grade_in_org(org_id: str, grade: JobGradeCreate,
                                  _user=Depends(require_super_admin)):
    """Create a new job grade."""
    try:
        data = {
            "organization_id": org_id,
            "name": grade.name,
            "level": grade.level
        }
        response = supabase_admin.table("job_grades").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Job Titles
@router.get("/api/organizations/{org_id}/job-titles")
async def get_job_titles(org_id: str, _user=Depends(require_super_admin)):
    """List job titles for an organization."""
    try:
        response = supabase_admin.table("job_titles")\
            .select("*, job_grades(name, level)")\
            .eq("organization_id", org_id)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/organizations/{org_id}/job-titles")
async def create_job_title_in_org(org_id: str, title: JobTitleCreate,
                                  _user=Depends(require_super_admin)):
    """Create a new job title."""
    try:
        data = {
            "organization_id": org_id,
            "title": title.title,
            "default_grade_id": title.default_grade_id
        }
        response = supabase_admin.table("job_titles").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Org Units
@router.get("/api/organizations/{org_id}/org-units")
async def get_org_units(org_id: str, _user=Depends(require_super_admin)):
    """List organizational units."""
    try:
        # Fetch all units, frontend constructs tree
        response = supabase_admin.table("org_units").select("*")\
            .eq("organization_id", org_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/organizations/{org_id}/org-units")
async def create_org_unit(org_id: str, unit: OrgUnitCreate,
                          _user=Depends(require_super_admin)):
    """Create a new organizational unit."""
    try:
        data = {
            "organization_id": org_id,
            "name": unit.name,
            "type": unit.type,
            "parent_id": unit.parent_id,
            "manager_id": unit.manager_id
        }
        response = supabase_admin.table("org_units").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/api/org-units/{unit_id}")
async def update_org_unit(unit_id: str, updates: dict,
                          _user=Depends(require_super_admin)):
    """Update an organizational unit."""
    try:
        # Validate whitelist of fields
        allowed = {"name", "parent_id", "manager_id", "type"}
        data = {k: v for k, v in updates.items() if k in allowed}
        data["updated_at"] = datetime.utcnow().isoformat()

        response = supabase_admin.table("org_units")\
            .update(data).eq("id", unit_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Unit not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/api/org-units/{unit_id}")
async def delete_org_unit(unit_id: str, _user=Depends(require_super_admin)):
    """Delete an organizational unit."""
    try:
        supabase_admin.table("org_units")\
            .delete().eq("id", unit_id).execute()
        return {"message": "Org Unit deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/api/org-units/{unit_id}/history")
async def get_org_unit_history(unit_id: str,
                               _user=Depends(require_super_admin)):
    """Get history of an organizational unit."""
    try:
        response = supabase_admin.table("org_unit_history").select("*")\
            .eq("org_unit_id", unit_id)\
            .order("valid_from", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Positions
@router.get("/api/organizations/{org_id}/positions")
async def get_positions(org_id: str, _user=Depends(require_super_admin)):
    """List positions in an organization."""
    try:
        response = supabase_admin.table("positions").select(
            "*, job_titles(title), employees(first_name, last_name, email)"
        )\
            .eq("organization_id", org_id)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/organizations/{org_id}/positions")
async def create_position(org_id: str, pos: PositionCreate,
                          _user=Depends(require_super_admin)):
    """Create a new position."""
    try:
        data = {
            "organization_id": org_id,
            "org_unit_id": pos.org_unit_id,
            "job_title_id": pos.job_title_id,
            "is_manager_position": pos.is_manager_position,
            "occupant_id": pos.occupant_id
        }
        response = supabase_admin.table("positions").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/api/positions/{pos_id}")
async def update_position(pos_id: str, updates: dict,
                          _user=Depends(require_super_admin)):
    """Update a position."""
    try:
        allowed = {
            "org_unit_id", "job_title_id",
            "is_manager_position", "occupant_id"
        }
        data = {k: v for k, v in updates.items() if k in allowed}
        data["updated_at"] = datetime.utcnow().isoformat()

        response = supabase_admin.table("positions")\
            .update(data).eq("id", pos_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Position not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/api/positions/{pos_id}")
async def delete_position(pos_id: str, _user=Depends(require_super_admin)):
    """Delete a position."""
    try:
        supabase_admin.table("positions")\
            .delete().eq("id", pos_id).execute()
        return {"message": "Position deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/api/positions/{pos_id}/history")
async def get_position_history(pos_id: str,
                               _user=Depends(require_super_admin)):
    """Get history of a position."""
    try:
        response = supabase_admin.table("position_history").select("*")\
            .eq("position_id", pos_id)\
            .order("valid_from", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
