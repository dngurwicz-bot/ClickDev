"""Search Router for menu entities, organizational search and recent updates."""
from datetime import datetime, timedelta
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error

router = APIRouter(prefix="/api/organizations/{org_id}/search", tags=["Search"])

MENU_ENTITIES = [
    {"entity_type": "screen", "entity_key": "employees", "label": "כל העובדים", "route": "/dashboard/core/employees"},
    {"entity_type": "screen", "entity_key": "employees_new", "label": "עובד חדש", "route": "/dashboard/core/employees?new=true"},
    {"entity_type": "screen", "entity_key": "departments", "label": "מחלקות", "route": "/dashboard/core/departments"},
    {"entity_type": "screen", "entity_key": "divisions", "label": "חטיבות", "route": "/dashboard/core/divisions"},
    {"entity_type": "screen", "entity_key": "wings", "label": "אגפים", "route": "/dashboard/core/wings"},
    {"entity_type": "screen", "entity_key": "teams", "label": "צוותים", "route": "/dashboard/core/teams"},
    {"entity_type": "screen", "entity_key": "positions", "label": "עמדות", "route": "/dashboard/core/positions"},
    {"entity_type": "screen", "entity_key": "roles", "label": "תפקידים", "route": "/dashboard/core/roles"},
    {"entity_type": "screen", "entity_key": "grades", "label": "דרגות", "route": "/dashboard/core/grades"},
    {"entity_type": "screen", "entity_key": "titles", "label": "תארי תפקיד", "route": "/dashboard/core/titles"},
    {"entity_type": "screen", "entity_key": "announcements", "label": "הודעות", "route": "/announcements"},
    {"entity_type": "screen", "entity_key": "flow", "label": "CLICK Flow", "route": "/dashboard/flow"},
    {"entity_type": "screen", "entity_key": "flow_candidates", "label": "מועמדים", "route": "/dashboard/flow/candidates"},
    {"entity_type": "screen", "entity_key": "flow_onboarding", "label": "Onboarding", "route": "/dashboard/flow/onboarding"},
    {"entity_type": "screen", "entity_key": "docs", "label": "CLICK Docs", "route": "/dashboard/docs"},
    {"entity_type": "screen", "entity_key": "docs_templates", "label": "תבניות מסמך", "route": "/dashboard/docs/templates"},
    {"entity_type": "screen", "entity_key": "vision", "label": "CLICK Vision", "route": "/dashboard/vision"},
    {"entity_type": "screen", "entity_key": "vision_org_chart", "label": "Org Chart", "route": "/dashboard/vision/org-chart"},
    {"entity_type": "screen", "entity_key": "assets", "label": "CLICK Assets", "route": "/dashboard/assets"},
    {"entity_type": "screen", "entity_key": "assets_items", "label": "מלאי ציוד", "route": "/dashboard/assets/items"},
    {"entity_type": "screen", "entity_key": "assets_vehicles", "label": "צי רכבים", "route": "/dashboard/assets/vehicles"},
    {"entity_type": "screen", "entity_key": "vibe", "label": "CLICK Vibe", "route": "/dashboard/vibe"},
    {"entity_type": "screen", "entity_key": "vibe_portal", "label": "פורטל עובד", "route": "/dashboard/vibe/portal"},
    {"entity_type": "screen", "entity_key": "vibe_pulse", "label": "Pulse Surveys", "route": "/dashboard/vibe/pulse"},
    {"entity_type": "screen", "entity_key": "grow", "label": "CLICK Grow", "route": "/dashboard/grow"},
    {"entity_type": "screen", "entity_key": "grow_reviews", "label": "הערכות עובדים", "route": "/dashboard/grow/reviews"},
    {"entity_type": "screen", "entity_key": "grow_goals", "label": "יעדים", "route": "/dashboard/grow/goals"},
    {"entity_type": "screen", "entity_key": "insights", "label": "CLICK Insights", "route": "/dashboard/insights"},
    {"entity_type": "screen", "entity_key": "insights_kpis", "label": "KPIs", "route": "/dashboard/insights/kpis"},
    {"entity_type": "screen", "entity_key": "insights_reports", "label": "Reports", "route": "/dashboard/insights/reports"},
    {"entity_type": "screen", "entity_key": "profile", "label": "פרופיל", "route": "/dashboard/profile"},
]


def _assert_org_access(org_id: str, user_id: str):
    membership = supabase_admin.table("organization_members") \
        .select("organization_id") \
        .eq("user_id", user_id) \
        .eq("organization_id", org_id) \
        .limit(1).execute()

    if membership.data:
        return

    roles = supabase_admin.table("user_roles") \
        .select("organization_id") \
        .eq("user_id", user_id) \
        .eq("organization_id", org_id) \
        .limit(1).execute()

    if not roles.data:
        raise HTTPException(status_code=403, detail="Access denied for organization")


def _score(query: str, text: str) -> int:
    q = query.lower().strip()
    t = text.lower()
    if t == q:
        return 120
    if t.startswith(q):
        return 100
    if q in t:
        return 70
    return 0


@router.get("/menu")
async def search_menu_entities(org_id: str, q: str = Query(min_length=1), user=Depends(get_current_user)):
    """Search menu entities in CLICK app shell."""
    try:
        _assert_org_access(org_id, user.id)
        query = q.strip()
        results = []
        for item in MENU_ENTITIES:
            label_score = _score(query, item["label"])
            key_score = _score(query, item["entity_key"])
            score = max(label_score, key_score)
            if score > 0:
                results.append({**item, "score": score})

        results.sort(key=lambda x: x["score"], reverse=True)
        return {"items": results[:30]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/organizational")
async def search_organizational(
    org_id: str,
    q: str = Query(min_length=1),
    entities: str = Query(default="employees,org_units,positions,job_titles,job_grades"),
    from_date: str = Query(default="", alias="from"),
    to_date: str = Query(default="", alias="to"),
    user=Depends(get_current_user),
):
    """Search employees and HR core entities, grouped by category."""
    try:
        _assert_org_access(org_id, user.id)
        query = q.strip()
        wanted = {e.strip() for e in entities.split(",") if e.strip()}
        grouped: Dict[str, List[dict]] = {}

        if "employees" in wanted:
            emp_query = supabase_admin.table("employees").select(
                "id, employee_number, id_number, first_name_he, last_name_he, created_at"
            ).eq("organization_id", org_id).or_(
                f"employee_number.ilike.%{query}%,id_number.ilike.%{query}%,first_name_he.ilike.%{query}%,last_name_he.ilike.%{query}%"
            ).limit(25)
            if from_date:
                emp_query = emp_query.gte("created_at", from_date)
            if to_date:
                emp_query = emp_query.lte("created_at", to_date)
            resp = emp_query.execute()
            grouped["employees"] = [
                {
                    "id": row["id"],
                    "title": f"{row.get('last_name_he', '')} {row.get('first_name_he', '')}".strip(),
                    "subtitle": f"מס' עובד: {row.get('employee_number', '')} | ת.ז: {row.get('id_number', '')}",
                    "route": "/dashboard/core/employees",
                }
                for row in (resp.data or [])
            ]

        if "org_units" in wanted:
            resp = supabase_admin.table("org_units").select("id, name, type") \
                .eq("organization_id", org_id).ilike("name", f"%{query}%").limit(25).execute()
            grouped["org_units"] = [
                {
                    "id": row["id"],
                    "title": row["name"],
                    "subtitle": row.get("type", ""),
                    "route": "/dashboard/core/teams",
                }
                for row in (resp.data or [])
            ]

        if "positions" in wanted:
            resp = supabase_admin.table("positions").select("id, job_title_id, org_unit_id") \
                .eq("organization_id", org_id).limit(25).execute()
            items = []
            for row in (resp.data or []):
                if query not in (row.get("id", "") + row.get("job_title_id", "") + row.get("org_unit_id", "")).lower():
                    continue
                items.append(
                    {
                        "id": row["id"],
                        "title": f"משרה {row['id'][:8]}",
                        "subtitle": f"title: {row.get('job_title_id', '-')}",
                        "route": "/dashboard/core/positions",
                    }
                )
            grouped["positions"] = items[:25]

        if "job_titles" in wanted:
            resp = supabase_admin.table("job_titles").select("id, title") \
                .eq("organization_id", org_id).ilike("title", f"%{query}%").limit(25).execute()
            grouped["job_titles"] = [
                {
                    "id": row["id"],
                    "title": row["title"],
                    "subtitle": "תואר תפקיד",
                    "route": "/dashboard/core/titles",
                }
                for row in (resp.data or [])
            ]

        if "job_grades" in wanted:
            resp = supabase_admin.table("job_grades").select("id, name, level") \
                .eq("organization_id", org_id).or_(f"name.ilike.%{query}%,level::text.ilike.%{query}%").limit(25).execute()
            grouped["job_grades"] = [
                {
                    "id": row["id"],
                    "title": row["name"],
                    "subtitle": f"רמה {row.get('level', '')}",
                    "route": "/dashboard/core/grades",
                }
                for row in (resp.data or [])
            ]

        return {"groups": grouped}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/recent-updates")
async def get_recent_updates(
    org_id: str,
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    user=Depends(get_current_user),
):
    """Fetch recent updates from action journal and activity log."""
    try:
        _assert_org_access(org_id, user.id)
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()

        timeline = supabase_admin.table("employee_action_journal") \
            .select("id, employee_id, action_key, effective_at, created_at") \
            .eq("organization_id", org_id).gte("created_at", cutoff) \
            .order("created_at", desc=True).limit(limit).execute()

        updates = [
            {
                "id": row["id"],
                "source": "employee_action",
                "title": row.get("action_key", "employee action"),
                "subtitle": f"עובד: {row.get('employee_id', '')}",
                "created_at": row.get("created_at"),
                "route": "/dashboard/core/employees",
            }
            for row in (timeline.data or [])
        ]

        activity = []
        try:
            activity = supabase_admin.table("user_activity_logs") \
                .select("id, action_type, entity_type, entity_id, created_at") \
                .eq("organization_id", org_id).gte("created_at", cutoff) \
                .order("created_at", desc=True).limit(limit).execute().data or []
        except Exception:
            activity = []

        updates.extend(
            {
                "id": row["id"],
                "source": "activity_log",
                "title": row.get("action_type", "activity"),
                "subtitle": f"{row.get('entity_type', '')}: {row.get('entity_id', '')}",
                "created_at": row.get("created_at"),
                "route": "/dashboard",
            }
            for row in activity
        )

        updates.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return {"items": updates[:limit]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
