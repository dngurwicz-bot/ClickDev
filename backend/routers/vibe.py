"""CLICK Vibe module APIs."""
from datetime import datetime
from typing import Any

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

router = APIRouter(prefix="/api/organizations/{org_id}/vibe", tags=["CLICK Vibe"])

SURVEY_TRANSITIONS = {
    "draft": ["open", "closed"],
    "open": ["closed"],
    "closed": [],
}


def _to_dt(value: Any):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except Exception:
        return None


@router.get("/portal/posts")
async def list_posts(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    data = supabase_admin.table("employee_portal_posts").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/portal/posts")
async def create_post(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    payload = {"organization_id": org_id, "created_by": user.id, **body}
    resp = supabase_admin.table("employee_portal_posts").insert(payload).execute()
    post = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="PORTAL_POST_CREATED",
        entity_type="portal_post", entity_id=post.get("id"), after=post
    )
    return post


@router.put("/portal/posts/{post_id}")
async def update_post(org_id: str, post_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    current = supabase_admin.table("employee_portal_posts").select("*").eq("organization_id", org_id).eq("id", post_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Post not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase_admin.table("employee_portal_posts").update(body).eq("organization_id", org_id).eq("id", post_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="PORTAL_POST_UPDATED",
        entity_type="portal_post", entity_id=post_id, before=before, after=updated
    )
    return updated


@router.get("/events")
async def list_events(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    data = supabase_admin.table("company_events").select("*").eq("organization_id", org_id).order("event_date", desc=False).execute().data or []
    return {"items": data}


@router.post("/events")
async def create_event(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    resp = supabase_admin.table("company_events").insert({"organization_id": org_id, **body}).execute()
    event = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="COMPANY_EVENT_CREATED",
        entity_type="company_event", entity_id=event.get("id"), after=event
    )
    enqueue_notification(
        org_id=org_id,
        user_id=user.id,
        module_key="vibe",
        channel="in_app",
        template_key="vibe.event.created",
        payload_json={"event_id": event.get("id"), "title": event.get("title"), "event_date": event.get("event_date")},
    )
    return event


@router.get("/pulse/surveys")
async def list_surveys(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    data = supabase_admin.table("pulse_surveys").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/pulse/surveys")
async def create_survey(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    payload = {"organization_id": org_id, "created_by": user.id, **body}
    resp = supabase_admin.table("pulse_surveys").insert(payload).execute()
    survey = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="PULSE_SURVEY_CREATED",
        entity_type="pulse_survey", entity_id=survey.get("id"), after=survey
    )
    return survey


@router.post("/pulse/surveys/{survey_id}/transition")
async def transition_survey(org_id: str, survey_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    current = supabase_admin.table("pulse_surveys").select("*") \
        .eq("organization_id", org_id).eq("id", survey_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = current[0]
    target = ensure_transition(survey.get("status", "draft"), body.get("status"), SURVEY_TRANSITIONS, "pulse_survey")
    patch = {"status": target, "updated_at": utc_now_iso()}
    if target == "open":
        patch["opens_at"] = body.get("opens_at") or survey.get("opens_at") or utc_now_iso()
    if target == "closed":
        patch["closes_at"] = body.get("closes_at") or utc_now_iso()
    updated = supabase_admin.table("pulse_surveys").update(patch).eq("organization_id", org_id).eq("id", survey_id).execute().data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="PULSE_SURVEY_TRANSITION",
        entity_type="pulse_survey", entity_id=survey_id, before=survey, after=updated
    )
    if target == "open":
        enqueue_notification(
            org_id=org_id,
            user_id=user.id,
            module_key="vibe",
            channel="in_app",
            template_key="vibe.pulse.opened",
            payload_json={"survey_id": survey_id, "title": updated.get("title")},
        )
    return updated


@router.post("/pulse/surveys/{survey_id}/responses")
async def submit_response(org_id: str, survey_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    survey_rows = supabase_admin.table("pulse_surveys").select("*") \
        .eq("organization_id", org_id).eq("id", survey_id).limit(1).execute().data or []
    if not survey_rows:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = survey_rows[0]
    if survey.get("status") != "open":
        raise HTTPException(status_code=422, detail="Survey is not open")
    now = datetime.utcnow()
    opens_at = _to_dt(survey.get("opens_at"))
    closes_at = _to_dt(survey.get("closes_at"))
    if opens_at and now < opens_at:
        raise HTTPException(status_code=422, detail="Survey has not opened yet")
    if closes_at and now > closes_at:
        raise HTTPException(status_code=422, detail="Survey is closed")

    employee_id = body.get("employee_id")
    if not employee_id:
        mapping = supabase_admin.table("employee_user_mapping").select("employee_id") \
            .eq("organization_id", org_id).eq("user_id", user.id).limit(1).execute().data or []
        employee_id = mapping[0]["employee_id"] if mapping else None

    if employee_id:
        existing = supabase_admin.table("pulse_responses").select("id") \
            .eq("organization_id", org_id).eq("survey_id", survey_id).eq("employee_id", employee_id).limit(1).execute().data or []
        if existing:
            raise HTTPException(status_code=409, detail="Employee already submitted response for this survey")

    payload = {
        "organization_id": org_id,
        "survey_id": survey_id,
        "employee_id": employee_id,
        "response_json": body.get("response_json", {}),
        "submitted_at": datetime.utcnow().isoformat(),
    }
    resp = supabase_admin.table("pulse_responses").insert(payload).execute()
    response = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="vibe", action_type="PULSE_RESPONSE_SUBMITTED",
        entity_type="pulse_response", entity_id=response.get("id"), after=response, metadata={"survey_id": survey_id}
    )
    return response


@router.get("/pulse/surveys/{survey_id}/responses")
async def list_survey_responses(org_id: str, survey_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vibe")
    data = supabase_admin.table("pulse_responses").select("*").eq("organization_id", org_id).eq("survey_id", survey_id).order("submitted_at", desc=True).execute().data or []
    return {"items": data}
