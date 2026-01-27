"""
Router for employee-related endpoints.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies import require_super_admin, log_activity
from schemas import EmployeeCreate

router = APIRouter(tags=["Employees"])


@router.get("/api/organizations/{org_id}/employees")
async def get_employees(org_id: str, _user=Depends(require_super_admin)):
    """List employees in an organization."""
    try:
        response = supabase_admin.table("employees").select("*")\
            .eq("organization_id", org_id).order("first_name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/api/employees/{employee_id}/history")
async def get_employee_history(employee_id: str,
                               _user=Depends(require_super_admin)):
    """Get history of an employee's records."""
    try:
        response = supabase_admin.table("employee_history").select("*")\
            .eq("employee_id", employee_id)\
            .order("valid_from", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/api/employees")
async def create_employee(emp: EmployeeCreate,
                          user=Depends(require_super_admin)):
    """Create a new employee and their initial history record."""
    try:
        data = emp.dict(exclude_unset=True)

        # 1. Create Employee in 'employees' table
        response = supabase_admin.table("employees").insert(data).execute()
        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create employee"
            )

        new_emp = response.data[0]

        # 2. Create Initial History Record
        # We assume effective_date is today if not provided, or hire_date
        effective_date = data.get("hire_date",
                                  datetime.now().date().isoformat())

        history_data = {
            "employee_id": new_emp["id"],
            "organization_id": new_emp["organization_id"],
            "first_name": new_emp.get("first_name"),
            "last_name": new_emp.get("last_name"),
            "first_name_en": new_emp.get("first_name_en"),
            "last_name_en": new_emp.get("last_name_en"),
            "id_number": new_emp.get("id_number"),
            "job_title": new_emp.get("job_title"),
            "department": new_emp.get("department"),
            "manager_id": new_emp.get("manager_id"),
            "employment_type": new_emp.get("employment_type"),
            "employee_number": new_emp.get("employee_number"),
            "birth_date": new_emp.get("birth_date"),
            "valid_from": effective_date,
            "valid_to": None,
            "changed_by": user.id,
            "change_reason": "Changes upon creation"
        }

        # Insert history
        supabase_admin.table("employee_history")\
            .insert(history_data).execute()

        await log_activity(
            user_id=user.id,
            action_type="CREATE_EMPLOYEE",
            entity_type="EMPLOYEE",
            entity_id=new_emp["id"],
            organization_id=emp.organization_id,
            details={
                "name": f"{emp.first_name} {emp.last_name}",
                "job_title": emp.job_title
            }
        )

        return new_emp
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/api/employees/{employee_id}")
async def update_employee(employee_id: str, updates: dict,
                          user=Depends(require_super_admin)):
    """Update employee details and manage history."""
    try:
        # 0. Fetch current state for change detection
        current_res = supabase_admin.table("employees")\
            .select("*")\
            .eq("id", employee_id).single().execute()

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Employee not found")

        current_emp = current_res.data

        # Extract effective_date if present, else default to today
        effective_date = updates.pop(
            "effective_date",
            datetime.now().date().isoformat()
        )

        # Check for actual changes
        has_changes = False
        ignore_fields = ["updated_at", "created_at", "id", "organization_id"]

        relevant_updates = {}
        for key, value in updates.items():
            if key in ignore_fields:
                continue

            # Basic equality check.
            if current_emp.get(key) != value:
                has_changes = True
                relevant_updates[key] = value

        if not has_changes:
            # If nothing changed, just return the current state
            return current_emp

        # Standardize updates for the actual save
        updates["updated_at"] = datetime.utcnow().isoformat()

        # 1. Update 'employees' table (Current Snapshot)
        response = supabase_admin.table("employees")\
            .update(updates)\
            .eq("id", employee_id)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Employee not found after update"
            )

        updated_emp = response.data[0]

        # 2. History Management
        # A. Close previous history record (where valid_to is NULL)
        previous_history = supabase_admin.table("employee_history")\
            .select("id")\
            .eq("employee_id", employee_id)\
            .is_("valid_to", "null")\
            .execute()

        if previous_history.data:
            for hist in previous_history.data:
                supabase_admin.table("employee_history").update({
                    "valid_to": effective_date
                }).eq("id", hist["id"]).execute()

        # B. Create NEW history record
        new_history_data = {
            "employee_id": employee_id,
            "organization_id": updated_emp.get("organization_id"),
            # Copy all relevant fields from the UPDATED employee record
            "first_name": updated_emp.get("first_name"),
            "last_name": updated_emp.get("last_name"),
            "first_name_en": updated_emp.get("first_name_en"),
            "last_name_en": updated_emp.get("last_name_en"),
            "id_number": updated_emp.get("id_number"),
            "employee_number": updated_emp.get("employee_number"),
            "birth_date": updated_emp.get("birth_date"),
            "mobile": updated_emp.get("mobile"),
            "city": updated_emp.get("city"),
            "job_title": updated_emp.get("job_title"),
            "department": updated_emp.get("department"),
            "manager_id": updated_emp.get("manager_id"),
            "employment_type": updated_emp.get("employment_type"),
            "termination_date": updated_emp.get("termination_date"),
            "termination_reason": updated_emp.get("termination_reason"),

            "valid_from": effective_date,
            "valid_to": None,
            "changed_by": user.id,
            "change_reason": "Update details"
        }

        supabase_admin.table("employee_history")\
            .insert(new_history_data).execute()

        await log_activity(
            user_id=user.id,
            action_type="UPDATE_EMPLOYEE",
            entity_type="EMPLOYEE",
            entity_id=employee_id,
            organization_id=updated_emp.get("organization_id"),
            details=updates
        )

        return updated_emp
    except Exception as e:
        print(f"Error updating employee: {e}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str, user=Depends(require_super_admin)):
    """Delete an employee and their history (Hard Delete)."""
    try:
        # Check if employee has history or user mapping?
        # For now, we'll allow hard delete or maybe we should soft delete.
        # Let's assume hard delete for now as per other endpoints.

        # Get org_id for logging before delete
        emp = supabase_admin.table("employees").select("organization_id")\
            .eq("id", employee_id).single().execute()
        org_id = emp.data.get("organization_id") if emp.data else None

        supabase_admin.table("employees")\
            .delete().eq("id", employee_id).execute()

        await log_activity(
            user_id=user.id,
            action_type="DELETE_EMPLOYEE",
            entity_type="EMPLOYEE",
            entity_id=employee_id,
            organization_id=org_id
        )

        return {"message": "Employee deleted successfully"}
    except Exception as e:
        # Check for constraint violation details in the exception
        error_msg = str(e)
        if "foreign key constraint" in error_msg.lower():
            # Try to extract table name if possible
            # or just return the DB error
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot delete employee: Data integrity error. "
                    f"{error_msg}"
                )
            ) from e

        # Log the full error for debugging
        print(f"Delete Error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {error_msg}"
        ) from e
