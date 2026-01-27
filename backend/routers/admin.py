"""
Admin Router
Handles system-wide administrative tasks and announcements.
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies import require_super_admin, get_current_user
from schemas import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    TaskCreate, TaskUpdate
)

router = APIRouter(prefix="/api", tags=["Admin"])


# Announcements
@router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_announcements(user=Depends(get_current_user)):
    """Get announcements for current user's organization"""
    try:
        # Get user's organization
        user_roles = supabase_admin.table("user_roles")\
            .select("organization_id").eq("user_id", user.id).execute()

        if not user_roles.data:
            return []

        org_id = user_roles.data[0]["organization_id"]

        # Get announcements (RLS will filter automatically)
        response = supabase_admin.table("announcements")\
            .select("*").eq("is_active", True)\
            .order("created_at", desc=True).execute()

        # Additional filtering for specific targeting
        filtered = []
        for announcement in response.data:
            if announcement["target_type"] == "all":
                filtered.append(announcement)
            elif announcement["target_type"] == "specific" and \
                    announcement.get("target_organizations"):
                if org_id in announcement["target_organizations"]:
                    filtered.append(announcement)

        return filtered
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error fetching announcements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate,
                              user=Depends(require_super_admin)):
    """Create a new announcement (Super Admin only)"""
    try:
        announcement_data = {
            "title": announcement.title,
            "content": announcement.content,
            "type": announcement.type,
            "target_type": announcement.target_type,
            "target_organizations": announcement.target_organizations,
            "is_active": announcement.is_active,
            "created_by": user.id
        }

        response = supabase_admin.table("announcements")\
            .insert(announcement_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create announcement"
            )

        return response.data[0]
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error creating announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/announcements/{announcement_id}",
            response_model=AnnouncementResponse)
async def update_announcement(announcement_id: str,
                              announcement: AnnouncementUpdate,
                              _user=Depends(require_super_admin)):
    """Update an announcement (Super Admin only)"""
    try:
        update_data = {k: v for k, v in announcement.dict().items()
                       if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()

        response = supabase_admin.table("announcements")\
            .update(update_data).eq("id", announcement_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Announcement not found"
            )

        return response.data[0]
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error updating announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str,
                              _user=Depends(require_super_admin)):
    """Delete an announcement (Super Admin only)"""
    try:
        response = supabase_admin.table("announcements")\
            .delete().eq("id", announcement_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Announcement not found"
            )

        return {"message": "Announcement deleted successfully"}
    except Exception as e:  # pylint: disable=broad-except
        print(f"Error deleting announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# Task Management
@router.get("/tasks")
async def get_tasks(_user=Depends(require_super_admin)):
    """List all admin tasks"""
    try:
        response = supabase_admin.table("admin_tasks").select("*")\
            .order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/tasks")
async def create_task(task: TaskCreate, user=Depends(require_super_admin)):
    """Create a new admin task."""
    try:
        task_data = task.dict(exclude_unset=True)
        task_data["created_by"] = user.id

        # If assigned_to is 'self' or empty, assign to current user
        if not task_data.get("assigned_to") or \
                task_data.get("assigned_to") == "self":
            task_data["assigned_to"] = user.id

        response = supabase_admin.table("admin_tasks")\
            .insert(task_data).execute()
        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create task"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate,
                      _user=Depends(require_super_admin)):
    """Update an admin task."""
    try:
        updates = task.dict(exclude_unset=True)
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table("admin_tasks")\
            .update(updates).eq("id", task_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, _user=Depends(require_super_admin)):
    """Delete an admin task."""
    try:
        supabase_admin.table("admin_tasks")\
            .delete().eq("id", task_id).execute()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
