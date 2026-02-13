"""CLICK Docs module APIs."""
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

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

router = APIRouter(prefix="/api/organizations/{org_id}/docs", tags=["CLICK Docs"])

INSTANCE_TRANSITIONS = {
    "draft": ["rendered", "cancelled"],
    "rendered": ["sent_for_signature", "draft", "cancelled"],
    "sent_for_signature": ["signed", "signature_error", "cancelled"],
    "signature_error": ["rendered", "sent_for_signature", "cancelled"],
    "signed": [],
    "cancelled": [],
}

ENVELOPE_STATUSES = {"created", "sent", "delivered", "completed", "declined", "voided", "failed"}


@router.get("/templates")
async def list_templates(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    resp = supabase_admin.table("document_templates").select("*") \
        .eq("organization_id", org_id).order("created_at", desc=True).execute()
    return {"items": resp.data or []}


@router.post("/templates")
async def create_template(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    payload = {
        "organization_id": org_id,
        "template_key": body.get("template_key"),
        "title": body.get("title"),
        "body_html": body.get("body_html", ""),
        "placeholders": body.get("placeholders", []),
        "is_active": body.get("is_active", True),
        "created_by": user.id,
    }
    resp = supabase_admin.table("document_templates").insert(payload).execute()
    template = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_TEMPLATE_CREATED",
        entity_type="document_template",
        entity_id=template.get("id"),
        after=template,
    )
    return template


@router.put("/templates/{template_id}")
async def update_template(org_id: str, template_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    current = supabase_admin.table("document_templates").select("*") \
        .eq("organization_id", org_id).eq("id", template_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Template not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase_admin.table("document_templates").update(body) \
        .eq("organization_id", org_id).eq("id", template_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_TEMPLATE_UPDATED",
        entity_type="document_template",
        entity_id=template_id,
        before=before,
        after=updated,
    )
    return updated


@router.delete("/templates/{template_id}")
async def delete_template(org_id: str, template_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    supabase_admin.table("document_templates").delete().eq("organization_id", org_id).eq("id", template_id).execute()
    return {"ok": True}


@router.get("/instances")
async def list_instances(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    resp = supabase_admin.table("document_instances").select("*") \
        .eq("organization_id", org_id).order("created_at", desc=True).execute()
    return {"items": resp.data or []}


@router.post("/instances")
async def create_instance(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    payload = {
        "organization_id": org_id,
        "template_id": body.get("template_id"),
        "subject_employee_id": body.get("subject_employee_id"),
        "status": body.get("status", "draft"),
        "title": body.get("title", "Document"),
        "merged_payload": body.get("merged_payload", {}),
        "rendered_html": body.get("rendered_html", ""),
        "created_by": user.id,
    }
    resp = supabase_admin.table("document_instances").insert(payload).execute()
    instance = resp.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_INSTANCE_CREATED",
        entity_type="document_instance",
        entity_id=instance.get("id"),
        after=instance,
    )
    return instance


@router.post("/instances/{instance_id}/render")
async def render_instance(org_id: str, instance_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    instance_resp = supabase_admin.table("document_instances").select("*") \
        .eq("organization_id", org_id).eq("id", instance_id).limit(1).execute()
    if not instance_resp.data:
        raise HTTPException(status_code=404, detail="Instance not found")

    instance = instance_resp.data[0]
    template = None
    if instance.get("template_id"):
        template_resp = supabase_admin.table("document_templates").select("*") \
            .eq("organization_id", org_id).eq("id", instance["template_id"]).limit(1).execute()
        template = template_resp.data[0] if template_resp.data else None

    html = (template or {}).get("body_html") or instance.get("rendered_html") or ""
    payload = instance.get("merged_payload") or {}
    for key, value in payload.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))

    update = supabase_admin.table("document_instances").update({
        "rendered_html": html,
        "status": "rendered",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", instance_id).execute()

    current_versions = supabase_admin.table("document_versions").select("version_no") \
        .eq("document_instance_id", instance_id).order("version_no", desc=True).limit(1).execute().data or []
    next_version = (current_versions[0]["version_no"] + 1) if current_versions else 1

    supabase_admin.table("document_versions").insert({
        "document_instance_id": instance_id,
        "version_no": next_version,
        "rendered_html": html,
        "created_by": user.id,
    }).execute()

    updated = update.data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_RENDERED",
        entity_type="document_instance",
        entity_id=instance_id,
        after=updated,
        metadata={"version_no": next_version},
    )
    return updated


@router.get("/instances/{instance_id}/pdf")
async def render_pdf(org_id: str, instance_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    resp = supabase_admin.table("document_instances").select("title, rendered_html") \
        .eq("organization_id", org_id).eq("id", instance_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Instance not found")

    instance = resp.data[0]

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle(instance.get("title", "document"))
    text = pdf.beginText(40, 800)
    text.setFont("Helvetica", 11)

    lines = (instance.get("rendered_html") or "").replace("<br>", "\n").replace("</p>", "\n").replace("<p>", "").split("\n")
    for line in lines[:80]:
        text.textLine(line[:120])

    pdf.drawText(text)
    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": f"inline; filename=document_{instance_id}.pdf"
    })


@router.post("/signatures/{instance_id}/send")
async def send_instance_signature(org_id: str, instance_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    inst_resp = supabase_admin.table("document_instances").select("*") \
        .eq("organization_id", org_id).eq("id", instance_id).limit(1).execute().data or []
    if not inst_resp:
        raise HTTPException(status_code=404, detail="Instance not found")
    instance = inst_resp[0]
    ensure_transition(instance.get("status", "draft"), "sent_for_signature", INSTANCE_TRANSITIONS, "document_instance")
    adapter = DocuSignAdapter()
    envelope = await adapter.create_envelope(
        subject=body.get("subject", "Document Signature"),
        email=body.get("email", ""),
        name=body.get("name", "Signer"),
        document_base64=body.get("document_base64", ""),
        filename=body.get("filename", "document.pdf"),
    )

    row = {
        "organization_id": org_id,
        "document_instance_id": instance_id,
        "provider": "docusign",
        "envelope_id": envelope.payload.get("envelopeId"),
        "status": "sent" if envelope.ok else "failed",
        "callback_payload": envelope.payload,
    }
    saved = supabase_admin.table("signature_envelopes").insert(row).execute()
    next_status = "sent_for_signature" if envelope.ok else "signature_error"
    supabase_admin.table("document_instances").update({
        "status": next_status,
        "updated_at": utc_now_iso(),
    }).eq("organization_id", org_id).eq("id", instance_id).execute()
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_SENT_FOR_SIGNATURE",
        entity_type="document_instance",
        entity_id=instance_id,
        before=instance,
        after={"status": next_status},
        metadata={"provider_ok": envelope.ok},
    )
    if envelope.ok:
        enqueue_notification(
            org_id=org_id,
            user_id=user.id,
            module_key="docs",
            channel="in_app",
            template_key="docs.signature.sent",
            payload_json={"instance_id": instance_id, "envelope_id": row.get("envelope_id")},
        )

    return {"signature_envelope": saved.data[0] if saved.data else row, "provider_response": envelope.payload}


@router.post("/instances/{instance_id}/transition")
async def transition_instance(org_id: str, instance_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "docs")
    current = supabase_admin.table("document_instances").select("*") \
        .eq("organization_id", org_id).eq("id", instance_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Instance not found")
    instance = current[0]
    target = ensure_transition(instance.get("status", "draft"), body.get("status"), INSTANCE_TRANSITIONS, "document_instance")
    updated = supabase_admin.table("document_instances").update({
        "status": target,
        "updated_at": utc_now_iso(),
    }).eq("organization_id", org_id).eq("id", instance_id).execute().data[0]
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="docs",
        action_type="DOCUMENT_STATUS_TRANSITION",
        entity_type="document_instance",
        entity_id=instance_id,
        before=instance,
        after=updated,
    )
    return updated


@router.post("/signatures/{envelope_id}/callback")
async def signature_callback(org_id: str, envelope_id: str, body: dict):
    status = str(body.get("status", "")).strip().lower()
    if status not in ENVELOPE_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid envelope status")
    envelope_rows = supabase_admin.table("signature_envelopes").select("*") \
        .eq("organization_id", org_id).eq("envelope_id", envelope_id).limit(1).execute().data or []
    if not envelope_rows:
        raise HTTPException(status_code=404, detail="Envelope not found")
    env = envelope_rows[0]

    patch = {"status": status, "callback_payload": body, "updated_at": utc_now_iso()}
    if status in {"completed"}:
        patch["completed_at"] = utc_now_iso()
    if status in {"sent", "delivered"}:
        patch["sent_at"] = patch["updated_at"]
    updated_env = supabase_admin.table("signature_envelopes").update(patch) \
        .eq("organization_id", org_id).eq("id", env["id"]).execute().data[0]

    instance_status = "signed" if status == "completed" else ("sent_for_signature" if status in {"sent", "delivered"} else "signature_error")
    supabase_admin.table("document_instances").update({
        "status": instance_status,
        "updated_at": utc_now_iso(),
    }).eq("organization_id", org_id).eq("id", env.get("document_instance_id")).execute()

    add_audit_event(
        org_id=org_id,
        user_id=None,
        module_key="docs",
        action_type="SIGNATURE_CALLBACK",
        entity_type="signature_envelope",
        entity_id=env.get("id"),
        after=updated_env,
        metadata={"instance_status": instance_status},
    )
    return {"ok": True, "envelope": updated_env, "instance_status": instance_status}
