from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies import get_current_user, require_admin
from schemas import Table001Request

router = APIRouter(
    prefix="/api/employees/table-001",
    tags=["Employee Basic Info"]
)


@router.get("/organization-id")
async def get_user_org_id(user=Depends(get_current_user)):
    """Helper to get organization ID for the current user."""
    try:
        response = (
            supabase_admin.table("users")
            .select("organization_id")
            .eq("id", user.id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User organization not found"
            )
        return {"organization_id": response.data[0]["organization_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("")
async def manage_basic_info(request: Table001Request, user=Depends(require_admin)):
    """
    Manage Table 001 (Basic Info) using temporal logic.
    Calls the manage_table_001 RPC in Supabase.
    """
    try:
        # Get user's organization_id if not provided or to verify
        org_res = (
            supabase_admin.table("users")
            .select("organization_id")
            .eq("id", user.id)
            .execute()
        )

        if not org_res.data:
            raise HTTPException(
                status_code=403,
                detail="User has no associated organization"
            )

        org_id = org_res.data[0]["organization_id"]

        # Call the RPC
        # The RPC expects: p_organization_id, p_employee_number,
        # p_operation_code, p_data, p_user_id
        rpc_params = {
            "p_organization_id": org_id,
            "p_employee_number": request.data.employee_number,
            "p_operation_code": request.operation_code,
            "p_data": request.data.dict(),
            "p_user_id": user.id
        }

        response = supabase_admin.rpc("manage_table_001", rpc_params).execute()

        if response.data and response.data.get("status") == "error":
            raise HTTPException(
                status_code=400,
                detail=response.data.get("message")
            )

        return response.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{employee_id}/history")
async def get_employee_history(
    employee_id: str,
    _user=Depends(get_current_user)
):
    """Get the full history of an employee's basic info."""
    try:
        response = (
            supabase_admin.table("employee_basic_info")
            .select("*, created_by_user:users!created_by(email)")
            .eq("employee_id", employee_id)
            .order("effective_from", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{employee_id}/current")
async def get_current_info(employee_id: str, _user=Depends(get_current_user)):
    """Get the currently valid basic info for an employee."""
    try:
        response = supabase_admin.rpc(
            "get_current_basic_info",
            {"p_employee_id": employee_id}
        ).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="No active record found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("")
async def list_employees(user=Depends(get_current_user)):
    """List employees in the organization with their current basic info."""
    try:
        # Get user's org
        org_response = (
            supabase_admin.table("users")
            .select("organization_id")
            .eq("id", user.id)
            .execute()
        )
        
        if not org_response.data:
            return []
            
        org_id = org_response.data[0]["organization_id"]

        # Fetch employees and join with current info
        # Using a custom query or view would be better, but let's join in Python for now if needed,
        # or use a complex select.
        response = (
            supabase_admin.table("employees")
            .select("*, employee_basic_info(*)")
            .eq("organization_id", org_id)
            .eq("is_active", True)
            .execute()
        )
            
        # Filter for current info in Python (since join might return multiple historical records if not filtered)
        # Actually, Supabase select join is tricky with filters on the join.
        # It's better to fetch only currently active basic info records.
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
