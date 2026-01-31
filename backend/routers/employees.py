"""
Employees Router
Handles employee-related operations including creation via the
event-based system (Table 001).
"""

from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from schemas import Table001Request  # pylint: disable=import-error

router = APIRouter(
    prefix="/api/organizations/{org_id}/employees",
    tags=["Employees"]
)


@router.get("")
async def get_employees(org_id: str, _user=Depends(get_current_user)):
    """List employees for an organization."""
    try:
        response = supabase_admin.table("employees")\
            .select("*")\
            .eq("organization_id", org_id)\
            .order("created_at", desc=True)\
            .execute()

        # Format for frontend (mapping DB fields back to UI names)
        employees = []
        for emp in response.data:
            employees.append({
                "id": emp["id"],
                "employeeNumber": emp["employee_number"],
                "firstName": emp["first_name_he"],
                "lastName": emp["last_name_he"],
                "fatherName": emp["father_name_he"],
                "birthDate": emp["birth_date"],  # ISO formatted from DB
                "idNumber": emp["id_number"],
                "department": "99",  # Mocked
                "position": "חדש",
                "budgetItem": "1000",
                "status": "עובד רגיל",
                "code": "001"
            })
        return employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("")
async def manage_employee(
    org_id: str,
    req: Table001Request,
    user=Depends(get_current_user)
):
    """Manage employee data using the Table 001 event-based system."""
    try:
        # Map operation codes: ADD -> ' ', UPDATE -> '2', DELETE -> '3'
        # Also allow direct passing of ' ', '2', '3'
        op_map = {
            'ADD': ' ',
            'UPDATE': '2',
            'DELETE': '3',
            ' ': ' ',
            '2': '2',
            '3': '3'
        }
        op_code = op_map.get(req.operation_code, ' ')

        # Prepare payload for RPC
        rpc_data = {
            "p_organization_id": org_id,
            "p_employee_number": req.data.employee_number,
            "p_id_number": req.data.id_number,
            "p_operation_code": op_code,
            "p_event_data": {
                "firstName": req.data.first_name_he,
                "lastName": req.data.last_name_he,
                "fatherName": req.data.father_name_he,
                "birthDate": req.data.birth_date.isoformat()
                if hasattr(req.data.birth_date, 'isoformat')
                else req.data.birth_date,
                "idType": req.data.id_type,
                "effectiveFrom": req.data.effective_from.isoformat()
                if hasattr(req.data.effective_from, 'isoformat')
                else req.data.effective_from,
                "pageNumber": req.data.page_number
            },
            "p_user_id": user.id,
            "p_event_code": req.event_code  # Use event code from request
        }

        response = supabase_admin.rpc(
            "create_employee_event",
            rpc_data
        ).execute()

        if not response.data.get("success"):
            raise HTTPException(
                status_code=400,
                detail=response.data.get("error", "Failed to manage employee")
            )

        return response.data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e)) from e
