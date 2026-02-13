"""CLICK Insights module APIs."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error
from services.platform_runtime import (  # pylint: disable=import-error
    add_audit_event,
    ensure_module_enabled,
    utc_now_iso,
)

router = APIRouter(prefix="/api/organizations/{org_id}/insights", tags=["CLICK Insights"])


@router.get("/kpis")
async def list_kpis(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    defs = supabase_admin.table("kpi_definitions").select("*").eq("organization_id", org_id).order("kpi_key").execute().data or []
    return {"items": defs}


@router.post("/kpis")
async def create_kpi_definition(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    resp = supabase_admin.table("kpi_definitions").insert({"organization_id": org_id, **body}).execute()
    kpi = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="insights", action_type="KPI_DEFINITION_CREATED",
        entity_type="kpi_definition", entity_id=kpi.get("id"), after=kpi
    )
    return kpi


@router.get("/kpis/{kpi_id}/materializations")
async def list_kpi_materializations(org_id: str, kpi_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    data = supabase_admin.table("kpi_materializations").select("*").eq("kpi_definition_id", kpi_id).order("bucket_date", desc=True).execute().data or []
    return {"items": data}


@router.post("/kpis/{kpi_id}/materializations")
async def create_kpi_materialization(org_id: str, kpi_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    payload = {
        "organization_id": org_id,
        "kpi_definition_id": kpi_id,
        "bucket_date": body.get("bucket_date"),
        "value_numeric": body.get("value_numeric"),
        "value_json": body.get("value_json"),
    }
    resp = supabase_admin.table("kpi_materializations").insert(payload).execute()
    mat = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="insights", action_type="KPI_MATERIALIZED",
        entity_type="kpi_materialization", entity_id=mat.get("id"), after=mat
    )
    return mat


@router.post("/kpis/{kpi_id}/materialize-now")
async def materialize_kpi_now(org_id: str, kpi_id: str, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    kpi_rows = supabase_admin.table("kpi_definitions").select("*").eq("organization_id", org_id).eq("id", kpi_id).limit(1).execute().data or []
    if not kpi_rows:
        raise HTTPException(status_code=404, detail="KPI not found")
    kpi = kpi_rows[0]
    query_config = kpi.get("query_config") or {}
    metric_type = query_config.get("metric_type") or kpi.get("kpi_key")
    value_numeric = 0
    value_json = {}

    if metric_type in ("employees_count", "employees"):
        value_numeric = supabase_admin.table("employees").select("id", count="exact").eq("organization_id", org_id).execute().count or 0
    elif metric_type in ("open_positions_count", "open_positions"):
        value_numeric = supabase_admin.table("positions").select("id", count="exact").eq("organization_id", org_id).is_("occupant_id", "null").execute().count or 0
    elif metric_type in ("goals_completed_pct", "goals_completed"):
        goals = supabase_admin.table("goals").select("id,status").eq("organization_id", org_id).execute().data or []
        total = len(goals)
        completed = len([g for g in goals if g.get("status") == "completed"])
        value_numeric = round((completed / total) * 100, 2) if total else 0
        value_json = {"completed": completed, "total": total}
    else:
        value_json = {"note": "No built-in materializer for this metric_type", "metric_type": metric_type}

    payload = {
        "organization_id": org_id,
        "kpi_definition_id": kpi_id,
        "bucket_date": datetime.utcnow().date().isoformat(),
        "value_numeric": value_numeric,
        "value_json": value_json,
    }
    upsert = supabase_admin.table("kpi_materializations").upsert(payload, on_conflict="kpi_definition_id,bucket_date").execute()
    row = upsert.data[0] if upsert.data else payload
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="insights", action_type="KPI_MATERIALIZED_NOW",
        entity_type="kpi_definition", entity_id=kpi_id, metadata={"metric_type": metric_type, "value_numeric": value_numeric}
    )
    return row


@router.get("/dashboards/widgets")
async def list_dashboard_widgets(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    data = supabase_admin.table("dashboard_widgets").select("*").eq("organization_id", org_id).order("widget_key").execute().data or []
    return {"items": data}


@router.post("/dashboards/widgets")
async def create_dashboard_widget(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    payload = {"organization_id": org_id, "created_by": user.id, **body}
    resp = supabase_admin.table("dashboard_widgets").insert(payload).execute()
    widget = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="insights", action_type="DASHBOARD_WIDGET_CREATED",
        entity_type="dashboard_widget", entity_id=widget.get("id"), after=widget
    )
    return widget


@router.get("/reports")
async def list_reports(org_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    defs = supabase_admin.table("report_definitions").select("*").eq("organization_id", org_id).order("report_key").execute().data or []
    return {"items": defs}


@router.post("/reports")
async def create_report_definition(org_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_admin(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    payload = {"organization_id": org_id, "created_by": user.id, **body}
    resp = supabase_admin.table("report_definitions").insert(payload).execute()
    report = resp.data[0]
    add_audit_event(
        org_id=org_id, user_id=user.id, module_key="insights", action_type="REPORT_DEFINITION_CREATED",
        entity_type="report_definition", entity_id=report.get("id"), after=report
    )
    return report


@router.post("/reports/{report_id}/run")
async def run_report(org_id: str, report_id: str, body: dict, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    definition = supabase_admin.table("report_definitions").select("*").eq("organization_id", org_id).eq("id", report_id).limit(1).execute().data or []
    if not definition:
        raise HTTPException(status_code=404, detail="Report definition not found")
    queued_payload = {
        "organization_id": org_id,
        "report_definition_id": report_id,
        "status": "queued",
        "output_url": None,
        "started_at": None,
        "finished_at": None,
        "metadata_json": {"params": body.get("params", {}), "requested_by": user.id},
    }
    created = supabase_admin.table("report_runs").insert(queued_payload).execute().data[0]
    run_id = created["id"]
    started_at = utc_now_iso()
    try:
        supabase_admin.table("report_runs").update({"status": "running", "started_at": started_at, "updated_at": utc_now_iso()}) \
            .eq("organization_id", org_id).eq("id", run_id).execute()
        output_url = body.get("output_url") or f"/api/organizations/{org_id}/insights/reports/{report_id}/runs/{run_id}/download"
        finished = supabase_admin.table("report_runs").update({
            "status": "completed",
            "output_url": output_url,
            "finished_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        }).eq("organization_id", org_id).eq("id", run_id).execute().data[0]
        add_audit_event(
            org_id=org_id, user_id=user.id, module_key="insights", action_type="REPORT_RUN_COMPLETED",
            entity_type="report_run", entity_id=run_id, after=finished
        )
        return finished
    except Exception as exc:
        failed = supabase_admin.table("report_runs").update({
            "status": "failed",
            "finished_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
            "metadata_json": {"error": str(exc)[:500]},
        }).eq("organization_id", org_id).eq("id", run_id).execute().data[0]
        add_audit_event(
            org_id=org_id, user_id=user.id, module_key="insights", action_type="REPORT_RUN_FAILED",
            entity_type="report_run", entity_id=run_id, after=failed
        )
        return failed


@router.get("/reports/{report_id}/runs")
async def list_report_runs(org_id: str, report_id: str, user=Depends(get_current_user)):
    assert_org_access(org_id, user.id)
    ensure_module_enabled(org_id, "insights")
    runs = supabase_admin.table("report_runs").select("*").eq("report_definition_id", report_id).order("created_at", desc=True).execute().data or []
    return {"items": runs}
