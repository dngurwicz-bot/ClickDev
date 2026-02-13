"""CLICK Assets module APIs."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.platform_runtime import (  # pylint: disable=import-error
    add_audit_event,
    ensure_module_enabled,
    enqueue_notification,
    utc_now_iso,
)

router = APIRouter(prefix="/api/organizations/{org_id}/assets", tags=["CLICK Assets"])


@router.get("/items")
async def list_items(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    data = supabase_admin.table("asset_catalog").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/items")
async def create_item(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    resp = supabase_admin.table("asset_catalog").insert({"organization_id": org_id, **body}).execute()
    item = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="ASSET_CREATED",
        entity_type="asset_item", entity_id=item.get("id"), after=item
    )
    return item


@router.put("/items/{item_id}")
async def update_item(org_id: str, item_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    current = supabase_admin.table("asset_catalog").select("*").eq("organization_id", org_id).eq("id", item_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Asset not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase_admin.table("asset_catalog").update(body).eq("organization_id", org_id).eq("id", item_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="ASSET_UPDATED",
        entity_type="asset_item", entity_id=item_id, before=before, after=updated
    )
    return updated


@router.delete("/items/{item_id}")
async def delete_item(org_id: str, item_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    supabase_admin.table("asset_catalog").delete().eq("organization_id", org_id).eq("id", item_id).execute()
    return {"ok": True}


@router.get("/assignments")
async def list_assignments(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    data = supabase_admin.table("asset_assignments").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": data}


@router.post("/assignments")
async def assign_asset(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    asset_id = body.get("asset_id")
    if not asset_id:
        raise HTTPException(status_code=422, detail="asset_id is required")
    asset_rows = supabase_admin.table("asset_catalog").select("*").eq("organization_id", org_id).eq("id", asset_id).limit(1).execute().data or []
    if not asset_rows:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset = asset_rows[0]
    if asset.get("status") not in ("in_stock", "returned"):
        raise HTTPException(status_code=422, detail=f"Asset is not available for assignment (status={asset.get('status')})")

    payload = {
        "organization_id": org_id,
        "asset_id": asset_id,
        "employee_id": body.get("employee_id"),
        "assigned_at": body.get("assigned_at"),
        "return_due_date": body.get("return_due_date"),
        "status": body.get("status", "assigned"),
        "notes": body.get("notes"),
    }
    resp = supabase_admin.table("asset_assignments").insert(payload).execute()

    supabase_admin.table("asset_catalog").update({
        "status": "assigned",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("organization_id", org_id).eq("id", asset_id).execute()
    assignment = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="ASSET_ASSIGNED",
        entity_type="asset_assignment", entity_id=assignment.get("id"), after=assignment
    )

    return assignment


@router.post("/assignments/{assignment_id}/return")
async def return_asset(org_id: str, assignment_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    assign_resp = supabase_admin.table("asset_assignments").select("*").eq("organization_id", org_id).eq("id", assignment_id).limit(1).execute()
    if not assign_resp.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment = assign_resp.data[0]
    if assignment.get("status") == "returned":
        raise HTTPException(status_code=422, detail="Assignment is already returned")
    updated = supabase_admin.table("asset_assignments").update({
        "returned_at": body.get("returned_at") or datetime.utcnow().date().isoformat(),
        "status": "returned",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", assignment_id).execute()

    supabase_admin.table("asset_catalog").update({
        "status": "in_stock",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("organization_id", org_id).eq("id", assignment.get("asset_id")).execute()
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="ASSET_RETURNED",
        entity_type="asset_assignment", entity_id=assignment_id, before=assignment, after=updated.data[0]
    )

    return updated.data[0]


@router.get("/vehicles")
async def list_vehicles(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    vehicles = supabase_admin.table("vehicle_records").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute().data or []
    return {"items": vehicles}


@router.post("/vehicles")
async def create_vehicle(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    resp = supabase_admin.table("vehicle_records").insert({"organization_id": org_id, **body}).execute()
    vehicle = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="VEHICLE_CREATED",
        entity_type="vehicle_record", entity_id=vehicle.get("id"), after=vehicle
    )
    return vehicle


@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(org_id: str, vehicle_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    current = supabase_admin.table("vehicle_records").select("*").eq("organization_id", org_id).eq("id", vehicle_id).limit(1).execute().data or []
    if not current:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    before = current[0]
    body["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase_admin.table("vehicle_records").update(body).eq("organization_id", org_id).eq("id", vehicle_id).execute()
    updated = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="assets", action_type="VEHICLE_UPDATED",
        entity_type="vehicle_record", entity_id=vehicle_id, before=before, after=updated
    )
    return updated


@router.get("/vehicles/reminders")
async def vehicle_reminders(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    policies = supabase_admin.table("vehicle_insurance_policies").select("*").eq("organization_id", org_id).execute().data or []
    tests = supabase_admin.table("vehicle_test_schedule").select("*").eq("organization_id", org_id).execute().data or []

    reminders = []
    now_date = datetime.utcnow().date()
    for p in policies:
        if p.get("end_date"):
            due = datetime.fromisoformat(p["end_date"]).date()
            if (due - now_date).days <= 30:
                reminders.append({"type": "insurance", "vehicle_id": p.get("vehicle_id"), "due_date": p.get("end_date")})

    for t in tests:
        if t.get("status") != "completed" and t.get("test_due_date"):
            due = datetime.fromisoformat(t["test_due_date"]).date()
            if (due - now_date).days <= 30:
                reminders.append({"type": "test", "vehicle_id": t.get("vehicle_id"), "due_date": t.get("test_due_date")})

    return {"items": reminders}


@router.post("/vehicles/reminders/dispatch")
async def dispatch_vehicle_reminders(org_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "assets")
    reminders = (await vehicle_reminders(org_id, user)).get("items", [])
    events = []
    for item in reminders:
        rows = enqueue_notification(
            org_id=org_id,
            user_id=user.id,
            module_key="assets",
            channel="in_app",
            template_key="assets.vehicle.compliance_due",
            payload_json=item,
            scheduled_for=utc_now_iso(),
        )
        events.extend(rows)
    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="assets",
        action_type="VEHICLE_REMINDERS_DISPATCHED",
        entity_type="vehicle_reminder_batch",
        entity_id=None,
        metadata={"count": len(events)},
    )
    return {"events": events, "count": len(events)}
