"""CLICK Grow module APIs."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.platform_runtime import (  # pylint: disable=import-error
    add_audit_event,
    ensure_module_enabled,
    ensure_transition,
    enqueue_notification,
    utc_now_iso,
)

router = APIRouter(prefix="/api/organizations/{org_id}/grow", tags=["CLICK Grow"])

CYCLE_TRANSITIONS = {
    "draft": ["active", "cancelled"],
    "active": ["closed", "cancelled"],
    "closed": [],
    "cancelled": [],
}

REVIEW_TRANSITIONS = {
    "pending": ["in_progress", "cancelled"],
    "in_progress": ["submitted", "cancelled"],
    "submitted": ["approved", "reopened"],
    "approved": [],
    "reopened": ["submitted", "cancelled"],
    "cancelled": [],
}

GOAL_TRANSITIONS = {
    "open": ["on_track", "at_risk", "completed", "cancelled"],
    "on_track": ["at_risk", "completed", "cancelled"],
    "at_risk": ["on_track", "completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}


@router.get("/review-cycles")
async def list_review_cycles(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    data = supabase_admin.table("review_cycles").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/review-cycles")
async def create_review_cycle(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    payload = {"organization_id": org_id, "created_by": user.id, **body}
    resp = supabase_admin.table("review_cycles").insert(payload).execute()
    cycle = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="REVIEW_CYCLE_CREATED",
        entity_type="review_cycle", entity_id=cycle.get("id"), after=cycle
    )
    return cycle


@router.post("/review-cycles/{cycle_id}/transition")
async def transition_review_cycle(org_id: str, cycle_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    rows = supabase_admin.table("review_cycles").select("*").eq("organization_id", org_id).eq("id", cycle_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    cycle = rows[0]
    target = ensure_transition(cycle.get("status", "draft"), body.get("status"), CYCLE_TRANSITIONS, "review_cycle")
    if target == "closed":
        pending_reviews = supabase_admin.table("performance_reviews").select("id", count="exact") \
            .eq("organization_id", org_id).eq("review_cycle_id", cycle_id).in_("status", ["pending", "in_progress", "reopened"]).execute().count or 0
        if pending_reviews > 0:
            raise HTTPException(status_code=422, detail="Cannot close cycle while reviews are still open")
    updated = supabase_admin.table("review_cycles").update({"status": target, "updated_at": utc_now_iso()}) \
        .eq("organization_id", org_id).eq("id", cycle_id).execute().data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="REVIEW_CYCLE_TRANSITION",
        entity_type="review_cycle", entity_id=cycle_id, before=cycle, after=updated
    )
    return updated


@router.get("/reviews")
async def list_reviews(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    data = supabase_admin.table("performance_reviews").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/reviews")
async def create_review(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    resp = supabase_admin.table("performance_reviews").insert({"organization_id": org_id, **body}).execute()
    review = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="PERFORMANCE_REVIEW_CREATED",
        entity_type="performance_review", entity_id=review.get("id"), after=review
    )
    return review


@router.put("/reviews/{review_id}")
async def update_review(org_id: str, review_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    rows = supabase_admin.table("performance_reviews").select("*").eq("organization_id", org_id).eq("id", review_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Review not found")
    before = rows[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    if body.get("status"):
        body["status"] = ensure_transition(before.get("status", "pending"), body["status"], REVIEW_TRANSITIONS, "performance_review")
    if body.get("status") == "submitted" and not body.get("submitted_at"):
        body["submitted_at"] = datetime.utcnow().isoformat()
    if body.get("score") is not None:
        score = float(body.get("score"))
        if score < 0 or score > 100:
            raise HTTPException(status_code=422, detail="Review score must be between 0 and 100")
    resp = supabase_admin.table("performance_reviews").update(body).eq("organization_id", org_id).eq("id", review_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="PERFORMANCE_REVIEW_UPDATED",
        entity_type="performance_review", entity_id=review_id, before=before, after=updated
    )
    if updated.get("status") == "submitted":
        enqueue_notification(
            org_id=org_id,
            user_id=updated.get("reviewer_id") or user.id,
            module_key="grow",
            channel="in_app",
            template_key="grow.review.submitted",
            payload_json={"review_id": review_id, "employee_id": updated.get("employee_id")},
        )
    return updated


@router.get("/goals")
async def list_goals(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    data = supabase_admin.table("goals").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/goals")
async def create_goal(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    resp = supabase_admin.table("goals").insert({"organization_id": org_id, **body}).execute()
    goal = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="GOAL_CREATED",
        entity_type="goal", entity_id=goal.get("id"), after=goal
    )
    return goal


@router.put("/goals/{goal_id}")
async def update_goal(org_id: str, goal_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    rows = supabase_admin.table("goals").select("*").eq("organization_id", org_id).eq("id", goal_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found")
    before = rows[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    if body.get("status"):
        body["status"] = ensure_transition(before.get("status", "open"), body["status"], GOAL_TRANSITIONS, "goal")
    if body.get("progress_pct") is not None:
        progress = int(body.get("progress_pct"))
        if progress < 0 or progress > 100:
            raise HTTPException(status_code=422, detail="Goal progress_pct must be between 0 and 100")
    resp = supabase_admin.table("goals").update(body).eq("organization_id", org_id).eq("id", goal_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="GOAL_UPDATED",
        entity_type="goal", entity_id=goal_id, before=before, after=updated
    )
    return updated


@router.post("/goals/{goal_id}/transition")
async def transition_goal(org_id: str, goal_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    rows = supabase_admin.table("goals").select("*").eq("organization_id", org_id).eq("id", goal_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = rows[0]
    target = ensure_transition(goal.get("status", "open"), body.get("status"), GOAL_TRANSITIONS, "goal")
    patch = {"status": target, "updated_at": utc_now_iso()}
    if target == "completed":
        patch["progress_pct"] = 100
    updated = supabase_admin.table("goals").update(patch).eq("organization_id", org_id).eq("id", goal_id).execute().data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="GOAL_TRANSITION",
        entity_type="goal", entity_id=goal_id, before=goal, after=updated
    )
    return updated


@router.get("/goals/{goal_id}/checkins")
async def list_goal_checkins(org_id: str, goal_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    data = supabase_admin.table("goal_checkins").select("*").eq("goal_id", goal_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/goals/{goal_id}/checkins")
async def create_goal_checkin(org_id: str, goal_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    progress = int(body.get("progress_pct", 0))
    if progress < 0 or progress > 100:
        raise HTTPException(status_code=422, detail="progress_pct must be between 0 and 100")
    payload = {
        "organization_id": org_id,
        "goal_id": goal_id,
        "progress_pct": progress,
        "notes": body.get("notes", ""),
        "checkin_date": body.get("checkin_date"),
        "created_by": user.id,
    }
    resp = supabase_admin.table("goal_checkins").insert(payload).execute()

    goal_rows = supabase_admin.table("goals").select("*").eq("organization_id", org_id).eq("id", goal_id).limit(1).execute().data or []
    if not goal_rows:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = goal_rows[0]
    next_status = goal.get("status", "open")
    if progress >= 100:
        next_status = "completed"
        progress = 100
    elif progress < 40:
        next_status = "at_risk"
    else:
        next_status = "on_track"
    supabase_admin.table("goals").update({
        "progress_pct": progress,
        "status": next_status,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", goal_id).execute()
    checkin = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="GOAL_CHECKIN_CREATED",
        entity_type="goal_checkin", entity_id=checkin.get("id"), after=checkin,
        metadata={"goal_id": goal_id, "goal_status": next_status}
    )
    if next_status == "at_risk":
        enqueue_notification(
            org_id=org_id,
            user_id=user.id,
            module_key="grow",
            channel="in_app",
            template_key="grow.goal.at_risk",
            payload_json={"goal_id": goal_id, "progress_pct": progress},
        )

    return checkin


@router.get("/coaching-sessions")
async def list_coaching_sessions(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    data = supabase_admin.table("coaching_sessions").select("*").eq("organization_id", org_id).order("session_date", desc=True).execute().data or []
    return {"items": data}


@router.post("/coaching-sessions")
async def create_coaching_session(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "grow")
    payload = {"organization_id": org_id, **body}
    if not payload.get("coach_user_id"):
        payload["coach_user_id"] = user.id
    resp = supabase_admin.table("coaching_sessions").insert(payload).execute()
    session = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="grow", action_type="COACHING_SESSION_CREATED",
        entity_type="coaching_session", entity_id=session.get("id"), after=session
    )
    return session
