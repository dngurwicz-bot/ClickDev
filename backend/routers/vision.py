"""CLICK Vision module APIs."""
from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.platform_runtime import add_audit_event, ensure_module_enabled  # pylint: disable=import-error

router = APIRouter(prefix="/api/organizations/{org_id}/vision", tags=["CLICK Vision"])


@router.get("/org-chart/live")
async def org_chart_live(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vision")

    units = supabase_admin.table("org_units").select("id, name, type, parent_id").eq("organization_id", org_id).execute().data or []
    employees = supabase_admin.table("employees").select("id, employee_number, first_name_he, last_name_he, org_unit_id").eq("organization_id", org_id).execute().data or []

    nodes = []
    edges = []

    for unit in units:
        nodes.append({
            "id": f"unit:{unit['id']}",
            "label": unit.get("name"),
            "entity_type": "org_unit",
            "entity_id": unit["id"],
            "metadata": {"type": unit.get("type")},
        })
        if unit.get("parent_id"):
            edges.append({"from": f"unit:{unit['parent_id']}", "to": f"unit:{unit['id']}", "edge_type": "reports_to"})

    for emp in employees:
        full_name = f"{emp.get('first_name_he', '')} {emp.get('last_name_he', '')}".strip()
        nodes.append({
            "id": f"emp:{emp['id']}",
            "label": full_name or emp.get("employee_number") or emp["id"],
            "entity_type": "employee",
            "entity_id": emp["id"],
            "metadata": {"employee_number": emp.get("employee_number")},
        })
        if emp.get("org_unit_id"):
            edges.append({"from": f"unit:{emp['org_unit_id']}", "to": f"emp:{emp['id']}", "edge_type": "contains"})

    return {"nodes": nodes, "edges": edges}


@router.post("/org-chart/snapshots")
async def create_snapshot(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "vision")
    payload = {
        "organization_id": org_id,
        "snapshot_name": body.get("snapshot_name", "Snapshot"),
        "snapshot_date": body.get("snapshot_date"),
        "metadata_json": body.get("metadata_json", {}),
        "created_by": user.id,
    }
    snapshot = supabase_admin.table("org_chart_snapshots").insert(payload).execute().data[0]

    live = await org_chart_live(org_id, user)
    node_rows = []
    edge_rows = []

    for node in live["nodes"]:
        node_rows.append({
            "organization_id": org_id,
            "snapshot_id": snapshot["id"],
            "entity_type": node["entity_type"],
            "entity_id": node.get("entity_id"),
            "label": node.get("label"),
            "level": 0,
            "metadata_json": node.get("metadata", {}),
        })

    inserted_nodes = supabase_admin.table("org_chart_nodes").insert(node_rows).execute().data or []
    map_by_entity = {(n.get("entity_type"), n.get("entity_id")): n["id"] for n in inserted_nodes}

    for edge in live["edges"]:
        def parse_ref(ref: str):
            parts = ref.split(":", 1)
            if len(parts) != 2:
                return None, None
            return ("org_unit" if parts[0] == "unit" else "employee"), parts[1]

        from_type, from_id = parse_ref(edge["from"])
        to_type, to_id = parse_ref(edge["to"])
        from_node_id = map_by_entity.get((from_type, from_id))
        to_node_id = map_by_entity.get((to_type, to_id))
        if from_node_id and to_node_id:
            edge_rows.append({
                "organization_id": org_id,
                "snapshot_id": snapshot["id"],
                "from_node_id": from_node_id,
                "to_node_id": to_node_id,
                "edge_type": edge.get("edge_type", "reports_to"),
            })

    if edge_rows:
        supabase_admin.table("org_chart_edges").insert(edge_rows).execute()

    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="vision",
        action_type="ORG_CHART_SNAPSHOT_CREATED",
        entity_type="org_chart_snapshot",
        entity_id=snapshot.get("id"),
        metadata={"nodes": len(node_rows), "edges": len(edge_rows)},
    )
    return snapshot


@router.get("/org-chart/snapshots")
async def list_snapshots(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vision")
    resp = supabase_admin.table("org_chart_snapshots").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute()
    return {"items": resp.data or []}


@router.get("/org-chart/gap-analysis")
async def gap_analysis(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "vision")
    units = supabase_admin.table("org_units").select("id, name, manager_id").eq("organization_id", org_id).execute().data or []
    employees = supabase_admin.table("employees").select("id, org_unit_id").eq("organization_id", org_id).execute().data or []

    emp_count_by_unit = {}
    for e in employees:
        uid = e.get("org_unit_id")
        if not uid:
            continue
        emp_count_by_unit[uid] = emp_count_by_unit.get(uid, 0) + 1

    alerts = []
    for unit in units:
        unit_id = unit["id"]
        count = emp_count_by_unit.get(unit_id, 0)
        if count > 20 and not unit.get("manager_id"):
            alerts.append({
                "alert_type": "missing_manager",
                "severity": "high",
                "title": f"יחידה גדולה ללא מנהל: {unit.get('name')}",
                "details": {"employee_count": count},
            })
        if count == 0:
            alerts.append({
                "alert_type": "empty_unit",
                "severity": "medium",
                "title": f"יחידה ללא עובדים: {unit.get('name')}",
                "details": {},
            })

    for alert in alerts:
        supabase_admin.table("org_chart_alerts").insert({
            "organization_id": org_id,
            "alert_type": alert["alert_type"],
            "severity": alert["severity"],
            "title": alert["title"],
            "details_json": alert["details"],
        }).execute()

    add_audit_event(
        org_id=org_id,
        user_id=user.id,
        module_key="vision",
        action_type="ORG_GAP_ANALYSIS_RUN",
        entity_type="org_chart_alert_batch",
        entity_id=None,
        metadata={"alerts_count": len(alerts)},
    )
    return {"alerts": alerts}
