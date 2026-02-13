"""CLICK Flow module APIs."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.integrations import DocuSignAdapter  # pylint: disable=import-error
from services.platform_runtime import (  # pylint: disable=import-error
    add_audit_event,
    ensure_module_enabled,
    ensure_transition,
    enqueue_notification,
    utc_now_iso,
)

router = APIRouter(prefix="/api/organizations/{org_id}/flow", tags=["CLICK Flow"])

CANDIDATE_TRANSITIONS = {
    "new": ["screening", "interview", "rejected"],
    "screening": ["interview", "rejected"],
    "interview": ["offer", "rejected"],
    "offer": ["hired", "rejected"],
    "hired": [],
    "rejected": [],
}

WORKFLOW_TRANSITIONS = {
    "draft": ["in_progress", "cancelled"],
    "in_progress": ["blocked", "completed", "cancelled"],
    "blocked": ["in_progress", "cancelled"],
    "completed": [],
    "cancelled": [],
}

TASK_TRANSITIONS = {
    "pending": ["in_progress", "blocked", "completed", "cancelled"],
    "in_progress": ["blocked", "completed", "cancelled"],
    "blocked": ["in_progress", "cancelled"],
    "completed": [],
    "cancelled": [],
}

CONTRACT_TRANSITIONS = {
    "draft": ["sent", "cancelled"],
    "sent": ["signed", "signature_error", "cancelled"],
    "signature_error": ["sent", "cancelled"],
    "signed": [],
    "cancelled": [],
}


def _list(table: str, org_id: str, limit: int = 200):
    return supabase_admin.table(table).select("*").eq("organization_id", org_id).order("created_at", desc=True).limit(limit).execute().data or []


@router.get("/candidates")
async def list_candidates(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    return {"items": _list("candidates", org_id)}


@router.post("/candidates")
async def create_candidate(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    payload = {"organization_id": org_id, **body}
    resp = supabase_admin.table("candidates").insert(payload).execute()
    created = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CANDIDATE_CREATED",
        entity_type="candidate",
        entity_id=created.get("id"),
        after=created,
    )
    return created


@router.put("/candidates/{candidate_id}")
async def update_candidate(org_id: str, candidate_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    existing = supabase_admin.table("candidates").select("*").eq("organization_id", org_id).eq("id", candidate_id).limit(1).execute().data or []
    if not existing:
        raise HTTPException(status_code=404, detail="Candidate not found")
    before = existing[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    if body.get("stage"):
        body["stage"] = ensure_transition(before.get("stage", "new"), body["stage"], CANDIDATE_TRANSITIONS, "candidate")
    resp = supabase_admin.table("candidates").update(body).eq("organization_id", org_id).eq("id", candidate_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CANDIDATE_UPDATED",
        entity_type="candidate",
        entity_id=candidate_id,
        before=before,
        after=updated,
    )
    return updated


@router.post("/candidates/{candidate_id}/transition")
async def transition_candidate(org_id: str, candidate_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")

    existing = supabase_admin.table("candidates").select("*").eq("organization_id", org_id).eq("id", candidate_id).limit(1).execute().data or []
    if not existing:
        raise HTTPException(status_code=404, detail="Candidate not found")
    candidate = existing[0]
    target = ensure_transition(candidate.get("stage", "new"), body.get("stage"), CANDIDATE_TRANSITIONS, "candidate")

    updated = supabase_admin.table("candidates").update({
        "stage": target,
        "updated_at": utc_now_iso(),
    }).eq("organization_id", org_id).eq("id", candidate_id).execute().data[0]

    created_workflow = None
    if target == "hired":
        wf_payload = {
            "organization_id": org_id,
            "candidate_id": candidate_id,
            "status": "draft",
            "start_date": body.get("start_date"),
            "first_day": body.get("first_day"),
            "due_date": body.get("due_date"),
            "metadata_json": {"auto_created_from_candidate": True},
        }
        wf_resp = supabase_admin.table("onboarding_workflows").insert(wf_payload).execute().data or []
        if wf_resp:
            created_workflow = wf_resp[0]
            enqueue_notification(
                org_id=org_id,
                user_id=user.id,
                module_key="flow",
                channel="in_app",
                template_key="flow.onboarding.auto_created",
                payload_json={"candidate_id": candidate_id, "workflow_id": created_workflow["id"]},
            )

    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CANDIDATE_STAGE_TRANSITION",
        entity_type="candidate",
        entity_id=candidate_id,
        before=candidate,
        after=updated,
        metadata={"workflow_created": bool(created_workflow)},
    )
    return {"candidate": updated, "workflow": created_workflow}


@router.delete("/candidates/{candidate_id}")
async def delete_candidate(org_id: str, candidate_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    supabase_admin.table("candidates").delete().eq("organization_id", org_id).eq("id", candidate_id).execute()
    return {"ok": True}


@router.get("/onboarding/workflows")
async def list_workflows(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    return {"items": _list("onboarding_workflows", org_id)}


@router.post("/onboarding/workflows")
async def create_workflow(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    payload = {"organization_id": org_id, **body}
    resp = supabase_admin.table("onboarding_workflows").insert(payload).execute()
    workflow = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="WORKFLOW_CREATED",
        entity_type="onboarding_workflow",
        entity_id=workflow.get("id"),
        after=workflow,
    )
    return workflow


@router.put("/onboarding/workflows/{workflow_id}")
async def update_workflow(org_id: str, workflow_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    current = supabase_admin.table("onboarding_workflows").select("*").eq("organization_id", org_id).eq("id", workflow_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Workflow not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    if body.get("status"):
        body["status"] = ensure_transition(before.get("status", "draft"), body["status"], WORKFLOW_TRANSITIONS, "workflow")
    resp = supabase_admin.table("onboarding_workflows").update(body).eq("organization_id", org_id).eq("id", workflow_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="WORKFLOW_UPDATED",
        entity_type="onboarding_workflow",
        entity_id=workflow_id,
        before=before,
        after=updated,
    )
    return updated


@router.post("/onboarding/workflows/{workflow_id}/transition")
async def transition_workflow(org_id: str, workflow_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    current = supabase_admin.table("onboarding_workflows").select("*").eq("organization_id", org_id).eq("id", workflow_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow = current[0]
    target = ensure_transition(workflow.get("status", "draft"), body.get("status"), WORKFLOW_TRANSITIONS, "workflow")
    patch = {"status": target, "updated_at": utc_now_iso()}
    if target == "completed":
        open_tasks = supabase_admin.table("onboarding_tasks").select("id", count="exact") \
            .eq("organization_id", org_id).eq("workflow_id", workflow_id).in_("status", ["pending", "in_progress", "blocked"]).execute().count or 0
        if open_tasks > 0:
            raise HTTPException(status_code=422, detail="Cannot complete workflow while open tasks exist")
    updated = supabase_admin.table("onboarding_workflows").update(patch).eq("organization_id", org_id).eq("id", workflow_id).execute().data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="WORKFLOW_STATUS_TRANSITION",
        entity_type="onboarding_workflow",
        entity_id=workflow_id,
        before=workflow,
        after=updated,
    )
    return updated


@router.get("/onboarding/tasks")
async def list_onboarding_tasks(org_id: str, workflow_id: str | None = None, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    query = supabase_admin.table("onboarding_tasks").select("*").eq("organization_id", org_id)
    if workflow_id:
        query = query.eq("workflow_id", workflow_id)
    return {"items": query.order("created_at", desc=True).limit(400).execute().data or []}


@router.post("/onboarding/tasks")
async def create_onboarding_task(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    payload = {"organization_id": org_id, **body}
    resp = supabase_admin.table("onboarding_tasks").insert(payload).execute()
    task = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="ONBOARDING_TASK_CREATED",
        entity_type="onboarding_task",
        entity_id=task.get("id"),
        after=task,
    )
    return task


@router.put("/onboarding/tasks/{task_id}")
async def update_onboarding_task(org_id: str, task_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    current = supabase_admin.table("onboarding_tasks").select("*").eq("organization_id", org_id).eq("id", task_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Task not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    if body.get("status"):
        body["status"] = ensure_transition(before.get("status", "pending"), body["status"], TASK_TRANSITIONS, "task")
    if body.get("status") == "completed" and not body.get("completed_at"):
        body["completed_at"] = datetime.utcnow().isoformat()
    resp = supabase_admin.table("onboarding_tasks").update(body).eq("organization_id", org_id).eq("id", task_id).execute()
    updated = resp.data[0]
    if updated.get("status") in ("blocked", "pending") and updated.get("assignee_user_id"):
        enqueue_notification(
            org_id=org_id,
            user_id=updated.get("assignee_user_id"),
            module_key="flow",
            channel="in_app",
            template_key="flow.task.attention_required",
            payload_json={"task_id": task_id, "title": updated.get("title"), "status": updated.get("status")},
        )
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="ONBOARDING_TASK_UPDATED",
        entity_type="onboarding_task",
        entity_id=task_id,
        before=before,
        after=updated,
    )
    if updated.get("workflow_id"):
        remaining = supabase_admin.table("onboarding_tasks").select("id", count="exact") \
            .eq("organization_id", org_id).eq("workflow_id", updated["workflow_id"]).in_("status", ["pending", "in_progress", "blocked"]).execute().count or 0
        if remaining == 0:
            supabase_admin.table("onboarding_workflows").update({"status": "completed", "updated_at": utc_now_iso()}) \
                .eq("organization_id", org_id).eq("id", updated["workflow_id"]).in_("status", ["in_progress", "blocked"]).execute()
    return updated


@router.get("/forms/{form_type}")
async def list_form_submissions(org_id: str, form_type: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    resp = supabase_admin.table("digital_forms_submissions").select("*") \
        .eq("organization_id", org_id).eq("form_type", form_type) \
        .order("submitted_at", desc=True).limit(200).execute()
    return {"items": resp.data or []}


@router.post("/forms/{form_type}")
async def submit_form(org_id: str, form_type: str, body: dict, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    payload = {
        "organization_id": org_id,
        "workflow_id": body.get("workflow_id"),
        "form_type": form_type,
        "subject_employee_id": body.get("subject_employee_id"),
        "form_data": body.get("form_data", {}),
        "status": body.get("status", "submitted"),
        "submitted_by": user.id,
    }
    resp = supabase_admin.table("digital_forms_submissions").insert(payload).execute()
    form = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="FORM_SUBMITTED",
        entity_type="digital_form_submission",
        entity_id=form.get("id"),
        after=form,
        metadata={"form_type": form_type},
    )
    return form


@router.get("/contracts")
async def list_contracts(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    return {"items": _list("employment_contracts", org_id)}


@router.post("/contracts")
async def create_contract(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    payload = {"organization_id": org_id, **body}
    resp = supabase_admin.table("employment_contracts").insert(payload).execute()
    contract = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CONTRACT_CREATED",
        entity_type="employment_contract",
        entity_id=contract.get("id"),
        after=contract,
    )
    return contract


@router.post("/contracts/{contract_id}/transition")
async def transition_contract(org_id: str, contract_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    existing = supabase_admin.table("employment_contracts").select("*") \
        .eq("organization_id", org_id).eq("id", contract_id).limit(1).execute().data or []
    if not existing:
        raise HTTPException(status_code=404, detail="Contract not found")
    before = existing[0]
    target = ensure_transition(before.get("status", "draft"), body.get("status"), CONTRACT_TRANSITIONS, "contract")
    updated = supabase_admin.table("employment_contracts").update({
        "status": target,
        "updated_at": utc_now_iso(),
    }).eq("organization_id", org_id).eq("id", contract_id).execute().data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CONTRACT_STATUS_TRANSITION",
        entity_type="employment_contract",
        entity_id=contract_id,
        before=before,
        after=updated,
    )
    return updated


@router.post("/contracts/{contract_id}/send")
async def send_contract_for_signature(org_id: str, contract_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "flow")

    contract_resp = supabase_admin.table("employment_contracts").select("*") \
        .eq("organization_id", org_id).eq("id", contract_id).limit(1).execute()
    if not contract_resp.data:
        raise HTTPException(status_code=404, detail="Contract not found")

    adapter = DocuSignAdapter()
    envelope = await adapter.create_envelope(
        subject=body.get("subject", "Employment Contract"),
        email=body.get("email", ""),
        name=body.get("name", "Employee"),
        document_base64=body.get("document_base64", ""),
        filename=body.get("filename", "contract.pdf"),
    )

    signature_row = {
        "organization_id": org_id,
        "contract_id": contract_id,
        "provider": "docusign",
        "envelope_id": envelope.payload.get("envelopeId"),
        "status": "sent" if envelope.ok else "failed",
        "callback_payload": envelope.payload,
    }
    sig = supabase_admin.table("contract_signatures").insert(signature_row).execute()

    contract_status = "sent" if envelope.ok else "signature_error"
    supabase_admin.table("employment_contracts").update({
        "status": contract_status,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("organization_id", org_id).eq("id", contract_id).execute()
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="flow",
        action_type="CONTRACT_SENT_FOR_SIGNATURE",
        entity_type="employment_contract",
        entity_id=contract_id,
        metadata={"provider": "docusign", "ok": envelope.ok},
    )
    if envelope.ok:
        enqueue_notification(
            org_id=org_id,
            user_id=user.id,
            module_key="flow",
            channel="in_app",
            template_key="flow.contract.sent_for_signature",
            payload_json={"contract_id": contract_id, "envelope_id": signature_row.get("envelope_id")},
        )

    return {"signature": sig.data[0] if sig.data else signature_row, "provider_response": envelope.payload}


@router.get("/contracts/{contract_id}/sign-status")
async def get_contract_sign_status(org_id: str, contract_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "flow")
    resp = supabase_admin.table("contract_signatures").select("*") \
        .eq("organization_id", org_id).eq("contract_id", contract_id) \
        .order("created_at", desc=True).limit(1).execute()
    return resp.data[0] if resp.data else {"status": "unknown"}
