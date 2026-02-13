"""UI Shell Router for Priority-like Home/Shortcuts/Saved searches/Active screens."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from schemas_ui_shell import (  # pylint: disable=import-error
    ActiveScreenHeartbeatRequest,
    SavedSearchCreateRequest,
    SavedSearchUpdateRequest,
    ShortcutCreateRequest,
    ShortcutGroupCreateRequest,
    ShortcutUpdateRequest,
    UiHomeLayoutUpdateRequest,
)

router = APIRouter(prefix="/api/organizations/{org_id}/ui", tags=["UI Shell"])


def _assert_org_access(org_id: str, user_id: str):
    membership = supabase_admin.table("organization_members") \
        .select("organization_id") \
        .eq("user_id", user_id) \
        .eq("organization_id", org_id) \
        .limit(1).execute()

    if membership.data:
        return

    roles = supabase_admin.table("user_roles") \
        .select("organization_id, role") \
        .eq("user_id", user_id) \
        .eq("organization_id", org_id) \
        .limit(1).execute()

    if not roles.data:
        raise HTTPException(status_code=403, detail="Access denied for organization")


def _load_shortcuts_for_user(org_id: str, user_id: str):
    groups_resp = supabase_admin.table("ui_shortcut_groups") \
        .select("*") \
        .eq("organization_id", org_id) \
        .eq("user_id", user_id) \
        .order("display_order").execute()

    groups = groups_resp.data or []
    group_ids = [g["id"] for g in groups]

    shortcuts = []
    if group_ids:
        shortcuts_resp = supabase_admin.table("ui_shortcuts") \
            .select("*") \
            .in_("group_id", group_ids) \
            .order("display_order").execute()
        shortcuts = shortcuts_resp.data or []

    grouped = {}
    for shortcut in shortcuts:
        grouped.setdefault(shortcut["group_id"], []).append(shortcut)

    for group in groups:
        group["shortcuts"] = grouped.get(group["id"], [])

    return groups


@router.get("/home")
async def get_ui_home(org_id: str, user=Depends(get_current_user)):
    """Return home layout, shortcuts and basic counters."""
    try:
        _assert_org_access(org_id, user.id)

        layout_resp = supabase_admin.table("ui_home_layouts") \
            .select("*") \
            .eq("organization_id", org_id) \
            .eq("user_id", user.id) \
            .limit(1).execute()
        layout = layout_resp.data[0] if layout_resp.data else None

        shortcut_groups = _load_shortcuts_for_user(org_id, user.id)

        employee_count = supabase_admin.table("employees").select("id", count="exact") \
            .eq("organization_id", org_id).execute().count or 0
        units_count = supabase_admin.table("org_units").select("id", count="exact") \
            .eq("organization_id", org_id).execute().count or 0
        positions_count = supabase_admin.table("positions").select("id", count="exact") \
            .eq("organization_id", org_id).execute().count or 0

        return {
            "widgets_json": (layout or {}).get("widgets_json", {}),
            "shortcut_groups": shortcut_groups,
            "counters": {
                "employees": employee_count,
                "org_units": units_count,
                "positions": positions_count,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.put("/home")
async def save_ui_home(org_id: str, req: UiHomeLayoutUpdateRequest, user=Depends(get_current_user)):
    """Persist home widgets/preferences."""
    try:
        _assert_org_access(org_id, user.id)

        payload = {
            "organization_id": org_id,
            "user_id": user.id,
            "widgets_json": req.widgets_json,
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase_admin.table("ui_home_layouts").upsert(
            payload,
            on_conflict="user_id,organization_id"
        ).execute()
        return result.data[0] if result.data else payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/shortcuts")
async def list_shortcuts(org_id: str, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        return {"groups": _load_shortcuts_for_user(org_id, user.id)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/shortcuts/groups")
async def create_shortcut_group(org_id: str, req: ShortcutGroupCreateRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        resp = supabase_admin.table("ui_shortcut_groups").insert({
            "organization_id": org_id,
            "user_id": user.id,
            "name": req.name,
            "display_order": req.display_order,
        }).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/shortcuts")
async def create_shortcut(org_id: str, req: ShortcutCreateRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        group_resp = supabase_admin.table("ui_shortcut_groups").select("id") \
            .eq("id", req.group_id).eq("organization_id", org_id).eq("user_id", user.id).limit(1).execute()
        if not group_resp.data:
            raise HTTPException(status_code=404, detail="Shortcut group not found")

        resp = supabase_admin.table("ui_shortcuts").insert({
            "group_id": req.group_id,
            "entity_type": req.entity_type,
            "entity_key": req.entity_key,
            "label": req.label,
            "route": req.route,
            "display_order": req.display_order,
        }).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/shortcuts/{shortcut_id}")
async def update_shortcut(org_id: str, shortcut_id: str, req: ShortcutUpdateRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        existing_resp = supabase_admin.table("ui_shortcuts").select("id, group_id") \
            .eq("id", shortcut_id).limit(1).execute()
        if not existing_resp.data:
            raise HTTPException(status_code=404, detail="Shortcut not found")

        group_id = existing_resp.data[0]["group_id"]
        group_resp = supabase_admin.table("ui_shortcut_groups").select("id") \
            .eq("id", group_id).eq("organization_id", org_id).eq("user_id", user.id).limit(1).execute()
        if not group_resp.data:
            raise HTTPException(status_code=403, detail="Cannot modify this shortcut")

        patch = {k: v for k, v in req.model_dump().items() if v is not None}
        if not patch:
            return existing_resp.data[0]

        resp = supabase_admin.table("ui_shortcuts").update(patch).eq("id", shortcut_id).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/shortcuts/{shortcut_id}")
async def delete_shortcut(org_id: str, shortcut_id: str, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        existing_resp = supabase_admin.table("ui_shortcuts").select("id, group_id") \
            .eq("id", shortcut_id).limit(1).execute()
        if not existing_resp.data:
            return {"ok": True}

        group_id = existing_resp.data[0]["group_id"]
        group_resp = supabase_admin.table("ui_shortcut_groups").select("id") \
            .eq("id", group_id).eq("organization_id", org_id).eq("user_id", user.id).limit(1).execute()
        if not group_resp.data:
            raise HTTPException(status_code=403, detail="Cannot delete this shortcut")

        supabase_admin.table("ui_shortcuts").delete().eq("id", shortcut_id).execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/saved-searches")
async def list_saved_searches(org_id: str, screen_key: str = Query(default=""), user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        query = supabase_admin.table("ui_saved_searches").select("*") \
            .eq("organization_id", org_id).eq("user_id", user.id)
        if screen_key:
            query = query.eq("screen_key", screen_key)
        resp = query.order("is_default", desc=True).order("updated_at", desc=True).execute()
        return {"items": resp.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/saved-searches")
async def create_saved_search(org_id: str, req: SavedSearchCreateRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        if req.is_default:
            supabase_admin.table("ui_saved_searches").update({"is_default": False}).eq("organization_id", org_id) \
                .eq("user_id", user.id).eq("screen_key", req.screen_key).execute()

        resp = supabase_admin.table("ui_saved_searches").insert({
            "organization_id": org_id,
            "user_id": user.id,
            "screen_key": req.screen_key,
            "name": req.name,
            "filters_json": req.filters_json,
            "is_default": req.is_default,
            "last_used_at": datetime.utcnow().isoformat(),
        }).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/saved-searches/{search_id}")
async def update_saved_search(org_id: str, search_id: str, req: SavedSearchUpdateRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        existing = supabase_admin.table("ui_saved_searches").select("*") \
            .eq("id", search_id).eq("organization_id", org_id).eq("user_id", user.id).limit(1).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Saved search not found")

        current = existing.data[0]
        patch = {}
        body = req.model_dump()
        for key in ("name", "filters_json", "is_default"):
            if body.get(key) is not None:
                patch[key] = body[key]

        if req.touch_last_used:
            patch["last_used_at"] = datetime.utcnow().isoformat()

        if patch.get("is_default") is True:
            supabase_admin.table("ui_saved_searches").update({"is_default": False}) \
                .eq("organization_id", org_id).eq("user_id", user.id).eq("screen_key", current["screen_key"]).execute()

        if not patch:
            return current

        resp = supabase_admin.table("ui_saved_searches").update(patch).eq("id", search_id).execute()
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/saved-searches/{search_id}")
async def delete_saved_search(org_id: str, search_id: str, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        supabase_admin.table("ui_saved_searches").delete().eq("id", search_id) \
            .eq("organization_id", org_id).eq("user_id", user.id).execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/active-screens/heartbeat")
async def heartbeat_active_screen(org_id: str, req: ActiveScreenHeartbeatRequest, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        now = datetime.utcnow().isoformat()
        payload = {
            "organization_id": org_id,
            "user_id": user.id,
            "session_id": req.session_id,
            "route": req.route,
            "screen_key": req.screen_key,
            "title": req.title,
            "last_seen_at": now,
            "opened_at": now,
        }
        resp = supabase_admin.table("ui_active_screens").upsert(
            payload,
            on_conflict="user_id,organization_id,session_id,route"
        ).execute()
        return resp.data[0] if resp.data else payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/active-screens")
async def list_active_screens(org_id: str, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        cutoff = (datetime.utcnow() - timedelta(minutes=30)).isoformat()
        resp = supabase_admin.table("ui_active_screens").select("*") \
            .eq("organization_id", org_id).eq("user_id", user.id) \
            .gte("last_seen_at", cutoff).order("last_seen_at", desc=True).execute()
        return {"items": resp.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/active-screens/{screen_id}")
async def close_active_screen(org_id: str, screen_id: str, user=Depends(get_current_user)):
    try:
        _assert_org_access(org_id, user.id)
        supabase_admin.table("ui_active_screens").delete().eq("id", screen_id) \
            .eq("organization_id", org_id).eq("user_id", user.id).execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
