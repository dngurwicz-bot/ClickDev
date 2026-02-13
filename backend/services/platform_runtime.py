"""Cross-module platform runtime helpers."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable

from fastapi import HTTPException

try:
    from database import supabase_admin  # pylint: disable=import-error
except Exception:  # pragma: no cover - allows pure helper tests without DB bootstrap
    supabase_admin = None


def _require_db():
    if supabase_admin is None:
        raise RuntimeError("Supabase admin client is not available")
    return supabase_admin


def ensure_module_enabled(org_id: str, module_key: str):
    """Guard module APIs by org entitlements + runtime flags."""
    db = _require_db()
    org = db.table("organizations").select("active_modules").eq("id", org_id).limit(1).execute().data or []
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    active_modules = org[0].get("active_modules") or []
    if module_key not in active_modules and module_key != "core":
        raise HTTPException(status_code=403, detail=f"Module '{module_key}' is not in organization plan")

    mod_flag = db.table("org_module_flags").select("enabled") \
        .eq("organization_id", org_id).eq("module_key", module_key).limit(1).execute().data or []
    if mod_flag and mod_flag[0].get("enabled") is False:
        raise HTTPException(status_code=403, detail=f"Module '{module_key}' is disabled by organization flag")


def ensure_transition(current: str, target: str, allowed: dict[str, Iterable[str]], entity_name: str):
    current_norm = (current or "").strip().lower()
    target_norm = (target or "").strip().lower()
    if not target_norm:
        raise HTTPException(status_code=422, detail=f"{entity_name}: target status is required")
    if current_norm == target_norm:
        return target_norm
    allowed_targets = {x.lower() for x in (allowed.get(current_norm) or [])}
    if target_norm not in allowed_targets:
        raise HTTPException(
            status_code=422,
            detail=f"{entity_name}: invalid transition {current_norm} -> {target_norm}",
        )
    return target_norm


def add_audit_event(
    *,
    org_id: str,
    user_id: str | None,
    module_key: str,
    action_type: str,
    entity_type: str,
    entity_id: str | None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
):
    db = _require_db()
    db.table("audit_events").insert({
        "organization_id": org_id,
        "user_id": user_id,
        "module_key": module_key,
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "before_json": before,
        "after_json": after,
        "metadata_json": metadata or {},
    }).execute()


def enqueue_notification(
    *,
    org_id: str,
    user_id: str | None,
    module_key: str,
    channel: str,
    template_key: str,
    payload_json: dict[str, Any],
    scheduled_for: str | None = None,
):
    db = _require_db()
    return db.table("notification_events").insert({
        "organization_id": org_id,
        "user_id": user_id,
        "module_key": module_key,
        "channel": channel,
        "template_key": template_key,
        "payload_json": payload_json,
        "status": "pending",
        "scheduled_for": scheduled_for,
    }).execute().data or []


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat()
