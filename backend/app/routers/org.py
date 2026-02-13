from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import AuthedUser, verify_jwt
from app.core.supabase import get_service_client

router = APIRouter(prefix="/org", tags=["org"])


def _default_org_id(user_id: str) -> str | None:
    try:
        sb = get_service_client()
    except RuntimeError:
        return None
    mem = (
        sb.table("org_members")
        .select("org_id,role,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    if not mem.data:
        return None
    return mem.data[0]["org_id"]


def _role_for_org(user_id: str, org_id: str) -> str | None:
    try:
        sb = get_service_client()
    except RuntimeError:
        return None
    mem = (
        sb.table("org_members")
        .select("role")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .limit(1)
        .execute()
    )
    if not mem.data:
        return None
    return mem.data[0]["role"]


@router.get("/modules")
def current_org_modules(user: AuthedUser = Depends(verify_jwt)):
    try:
        sb = get_service_client()
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    org_id = _default_org_id(user.user_id)
    if not org_id:
        return []

    mods = sb.table("modules").select("key,name").order("key", desc=False).execute().data or []
    flags = sb.table("org_modules").select("module_key,is_enabled").eq("org_id", org_id).execute().data or []
    flag_map = {f["module_key"]: bool(f["is_enabled"]) for f in flags}
    return [{"key": m["key"], "name": m["name"], "is_enabled": True if m["key"] == "core" else flag_map.get(m["key"], False)} for m in mods]


@router.get("/members")
def list_org_members(user: AuthedUser = Depends(verify_jwt)):
    try:
        sb = get_service_client()
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    org_id = _default_org_id(user.user_id)
    if not org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No org membership")

    role = _role_for_org(user.user_id, org_id)
    if role != "org_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="org_admin required")

    res = sb.table("org_members").select("*").eq("org_id", org_id).order("created_at", desc=False).execute()
    return res.data or []
