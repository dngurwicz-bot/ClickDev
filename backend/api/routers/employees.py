from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from api.models import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from api.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.get("/", response_model=List[EmployeeResponse])
async def get_employees(
    organization_id: Optional[str] = Query(None, description="Filter by organization ID"),
    supabase: Client = Depends(get_supabase_client)
):
    """Get all employees, optionally filtered by organization"""
    try:
        query = supabase.table("employees").select("*")
        
        if organization_id:
            query = query.eq("organization_id", organization_id)
        
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get employee by ID"""
    try:
        response = supabase.table("employees").select("*").eq("id", employee_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Employee not found")
        return response.data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee: {str(e)}")

@router.post("/", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate, supabase: Client = Depends(get_supabase_client)):
    """Create a new employee"""
    try:
        # Convert Pydantic model to dict, handling None values
        employee_data = employee.dict(exclude_none=True)
        response = supabase.table("employees").insert(employee_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create employee")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee: EmployeeUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    """Update an employee (triggers history tracking automatically)"""
    try:
        # Only include fields that are not None
        update_data = employee.dict(exclude_none=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("employees").update(update_data).eq("id", employee_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # The trigger automatically saves old data to job_history
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@router.delete("/{employee_id}")
async def delete_employee(employee_id: str, supabase: Client = Depends(get_supabase_client)):
    """Delete an employee"""
    try:
        response = supabase.table("employees").delete().eq("id", employee_id).execute()
        return {"message": "Employee deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")
