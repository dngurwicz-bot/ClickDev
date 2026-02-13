"""CLICK Actions Router - unique employee file API."""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user  # pylint: disable=import-error
from schemas import ClickActionRequest  # pylint: disable=import-error
from services.click_actions import ClickActionService  # pylint: disable=import-error

router = APIRouter(tags=["CLICK Actions"])
service = ClickActionService()


@router.get("/api/click-actions/catalog")
async def get_actions_catalog(_user=Depends(get_current_user)):
    """Return supported CLICK actions and payload contracts."""
    return {"actions": service.get_action_catalog()}


@router.post("/api/organizations/{org_id}/employees/{employee_id}/actions")
async def dispatch_employee_action(
    org_id: str,
    employee_id: str,
    req: ClickActionRequest,
    user=Depends(get_current_user),
):
    """Dispatch one CLICK action command against employee file."""
    try:
        return service.dispatch_action(
            org_id=org_id,
            employee_id=employee_id,
            action_key=req.action_key,
            effective_at=req.effective_at,
            payload=req.payload,
            request_id=req.request_id,
            user_id=user.id,
            user_token=user.token,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/organizations/{org_id}/employees/actions")
async def dispatch_employee_create_action(
    org_id: str,
    req: ClickActionRequest,
    user=Depends(get_current_user),
):
    """Dispatch employee profile creation action before employee_id exists."""
    try:
        if req.action_key != "employee_profile.created":
            raise HTTPException(
                status_code=400,
                detail="This endpoint only supports employee_profile.created",
            )
        return service.create_employee_profile_action(
            org_id=org_id,
            payload=req.payload,
            effective_at=req.effective_at,
            request_id=req.request_id,
            user_id=user.id,
            user_token=user.token,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/organizations/{org_id}/employees/{employee_id}/file")
async def get_employee_file(
    org_id: str,
    employee_id: str,
    user=Depends(get_current_user),
):
    """Get full employee file snapshot and temporal entities."""
    try:
        return service.get_employee_file(org_id=org_id, employee_id=employee_id, user_token=user.token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/organizations/{org_id}/employees/{employee_id}/timeline")
async def get_employee_timeline(
    org_id: str,
    employee_id: str,
    limit: int = 200,
    user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Get action journal timeline for employee."""
    try:
        result = service.get_employee_file(
            org_id=org_id,
            employee_id=employee_id,
            timeline_limit=limit,
            user_token=user.token,
        )
        return {"timeline": result["timeline"]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
