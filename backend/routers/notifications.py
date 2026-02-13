"""Notification hub router (in-app/push/email/sms) with provider abstraction."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.integrations import DocuSignAdapter, FCMAdapter, SendGridAdapter, TwilioAdapter  # pylint: disable=import-error

router = APIRouter(prefix="/api/organizations/{org_id}/notifications", tags=["Notifications"])


@router.post("/events")
async def create_notification_event(org_id: str, body: dict, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)
        payload = {
            "organization_id": org_id,
            "user_id": body.get("user_id") or user.id,
            "module_key": body.get("module_key"),
            "channel": body.get("channel", "in_app"),
            "template_key": body.get("template_key"),
            "payload_json": body.get("payload_json", {}),
            "status": "pending",
            "scheduled_for": body.get("scheduled_for"),
        }
        resp = supabase_admin.table("notification_events").insert(payload).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/events")
async def list_notification_events(org_id: str, user=Depends(get_current_user)):
    try:
        assert_org_access(org_id, user.id)
        resp = supabase_admin.table("notification_events").select("*") \
            .eq("organization_id", org_id).order("created_at", desc=True).limit(100).execute()
        return {"items": resp.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/events/{event_id}/dispatch")
async def dispatch_notification_event(org_id: str, event_id: str, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)

        event_resp = supabase_admin.table("notification_events").select("*") \
            .eq("organization_id", org_id).eq("id", event_id).limit(1).execute()
        if not event_resp.data:
            raise HTTPException(status_code=404, detail="Event not found")

        event = event_resp.data[0]
        channel = event.get("channel", "in_app")
        payload = event.get("payload_json") or {}

        provider = "in_app"
        target = payload.get("target", "")
        result = {"ok": True, "status_code": 200, "payload": {"message": "queued in-app"}}

        if channel == "email":
            provider = "sendgrid"
            adapter = SendGridAdapter()
            response = await adapter.send_email(
                to_email=payload.get("to_email", ""),
                subject=payload.get("subject", "CLICK Notification"),
                body=payload.get("body", ""),
            )
            result = {"ok": response.ok, "status_code": response.status_code, "payload": response.payload}
            target = payload.get("to_email", "")
        elif channel in ("sms", "whatsapp"):
            provider = "twilio"
            adapter = TwilioAdapter()
            response = await adapter.send_sms(
                to_number=payload.get("to_number", ""),
                body=payload.get("body", ""),
            )
            result = {"ok": response.ok, "status_code": response.status_code, "payload": response.payload}
            target = payload.get("to_number", "")
        elif channel == "push":
            provider = "fcm"
            adapter = FCMAdapter()
            response = await adapter.send_push(
                token=payload.get("token", ""),
                title=payload.get("title", "CLICK"),
                body=payload.get("body", ""),
                data=payload.get("data", {}),
            )
            result = {"ok": response.ok, "status_code": response.status_code, "payload": response.payload}
            target = payload.get("token", "")

        delivery = {
            "notification_event_id": event_id,
            "provider": provider,
            "target": target,
            "status": "delivered" if result["ok"] else "failed",
            "response_json": result,
            "attempts": 1,
            "last_attempt_at": datetime.utcnow().isoformat(),
            "delivered_at": datetime.utcnow().isoformat() if result["ok"] else None,
        }
        del_resp = supabase_admin.table("notification_deliveries").insert(delivery).execute()

        supabase_admin.table("notification_events").update({
            "status": "delivered" if result["ok"] else "failed",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", event_id).execute()

        return {"event": event, "delivery": del_resp.data[0] if del_resp.data else delivery}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/events/dispatch-pending")
async def dispatch_pending_events(org_id: str, limit: int = 50, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)
        pending = supabase_admin.table("notification_events").select("*") \
            .eq("organization_id", org_id).eq("status", "pending").order("created_at").limit(limit).execute().data or []
        delivered = 0
        failed = 0
        results = []
        for event in pending:
            outcome = await dispatch_notification_event(org_id, event["id"], user)
            delivery_status = (outcome.get("delivery") or {}).get("status")
            if delivery_status == "delivered":
                delivered += 1
            else:
                failed += 1
            results.append({"event_id": event["id"], "status": delivery_status})
        return {"count": len(results), "delivered": delivered, "failed": failed, "items": results}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/deliveries")
async def list_notification_deliveries(org_id: str, user=Depends(get_current_user)):
    try:
        assert_org_access(org_id, user.id)
        events = supabase_admin.table("notification_events").select("id") \
            .eq("organization_id", org_id).limit(500).execute().data or []
        event_ids = [e["id"] for e in events]
        if not event_ids:
            return {"items": []}

        resp = supabase_admin.table("notification_deliveries").select("*") \
            .in_("notification_event_id", event_ids).order("created_at", desc=True).limit(200).execute()
        return {"items": resp.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/deliveries/{delivery_id}/retry")
async def retry_delivery(org_id: str, delivery_id: str, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)
        delivery_rows = supabase_admin.table("notification_deliveries").select("*").eq("id", delivery_id).limit(1).execute().data or []
        if not delivery_rows:
            raise HTTPException(status_code=404, detail="Delivery not found")
        delivery = delivery_rows[0]
        event_rows = supabase_admin.table("notification_events").select("*").eq("id", delivery["notification_event_id"]).eq("organization_id", org_id).limit(1).execute().data or []
        if not event_rows:
            raise HTTPException(status_code=404, detail="Notification event not found")
        event = event_rows[0]
        supabase_admin.table("notification_events").update({"status": "pending", "updated_at": datetime.utcnow().isoformat()}) \
            .eq("id", event["id"]).execute()
        result = await dispatch_notification_event(org_id, event["id"], user)
        supabase_admin.table("notification_deliveries").update({
            "attempts": int(delivery.get("attempts") or 0) + 1,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", delivery_id).execute()
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/docusign/webhook")
async def docusign_webhook(org_id: str, request: Request):
    """DocuSign webhook callback endpoint with signature validation."""
    try:
        raw_body = await request.body()
        signature = request.headers.get("x-docusign-signature-1", "")
        adapter = DocuSignAdapter()

        valid = adapter.verify_webhook(raw_body, signature)
        body_json = {}
        try:
            body_json = await request.json()
        except Exception:
            body_json = {"raw": raw_body.decode("utf-8", errors="ignore")[:1200]}

        event_id = (body_json.get("data") or {}).get("envelopeId")

        supabase_admin.table("audit_events").insert({
            "organization_id": org_id,
            "module_key": "docs",
            "action_type": "DOCUSIGN_WEBHOOK",
            "entity_type": "signature_envelope",
            "entity_id": str(event_id) if event_id else None,
            "metadata_json": {
                "valid_signature": valid,
                "payload": body_json,
            },
        }).execute()

        return {"ok": True, "valid_signature": valid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
