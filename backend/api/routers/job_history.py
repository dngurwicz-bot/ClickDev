from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from api.models import JobHistoryResponse
from api.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.get("/", response_model=List[JobHistoryResponse])
async def get_job_history(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    supabase: Client = Depends(get_supabase_client)
):
    """Get job history records, optionally filtered by employee"""
    try:
        query = supabase.table("job_history").select("*")
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        response = query.order("recorded_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch job history: {str(e)}")

@router.get("/employee/{employee_id}", response_model=List[JobHistoryResponse])
async def get_employee_history(employee_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get complete job history for a specific employee"""
    try:
        response = supabase.table("job_history")\
            .select("*")\
            .eq("employee_id", employee_id)\
            .order("valid_from", desc=True)\
            .execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee history: {str(e)}")

@router.get("/{history_id}", response_model=JobHistoryResponse)
async def get_history_record(history_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get a specific job history record by ID"""
    try:
        response = supabase.table("job_history").select("*").eq("id", history_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="History record not found")
        return response.data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch history record: {str(e)}")
