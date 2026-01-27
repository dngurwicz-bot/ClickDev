from fastapi import APIRouter, Depends, HTTPException, Body
from database import supabase_admin
from dependencies import require_super_admin, log_activity
from logic.temporal_engine import TemporalEngine

router = APIRouter(tags=["Hilan Events"])
temporal_engine = TemporalEngine(supabase_admin)

@router.post("/api/events/{event_code}")
async def handle_event(
    event_code: int,
    payload: dict = Body(...),
    user=Depends(require_super_admin)
):
    """
    Generic endpoint for handling Hilan Events (200-series).
    Payload must include 'employee_id' and event-specific fields.
    """
    try:
        employee_id = payload.get("employee_id")
        if not employee_id:
            raise HTTPException(status_code=400, detail="Missing employee_id")

        # Extract Action Code (A=Insert, 3=Cancel) - Default to A
        action_code = payload.get("action_code", "A")

        # Process via Temporal Engine
        result = await temporal_engine.handle_event(
            event_code=event_code,
            employee_id=employee_id,
            new_record=payload,
            action_code=action_code
        )

        # Log Activity
        await log_activity(
            user_id=user.id,
            action_type=f"EVENT_{event_code}",
            entity_type="EMPLOYEE_EVENT",
            entity_id=employee_id,
            details={"event": event_code, "action": action_code}
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
