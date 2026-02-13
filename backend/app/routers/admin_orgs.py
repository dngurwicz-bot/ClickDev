from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.security import AuthedUser, verify_jwt
from app.core.supabase import get_service_client
from app.schemas import (
    MemberAddRequest,
    MemberResponse,
    MemberUpdateRequest,
    ModuleFlag,
    ModulesPatchRequest,
    OrgCreateRequest,
    OrgResponse,
    OrgUpdateRequest,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_system_admin(user: AuthedUser) -> None:
    try:
        sb = get_service_client()
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    sa = sb.table("system_admins").select("user_id").eq("user_id", user.user_id).execute()
    if not sa.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System admin required")


def _get_user_id_by_email(email: str) -> str | None:
    url = f"{settings.supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    params = {"email": email}
    with httpx.Client(timeout=15.0) as client:
        r = client.get(url, headers=headers, params=params)
        if r.status_code >= 400:
            return None
        data = r.json()
        users = data.get("users") if isinstance(data, dict) else None
        if not users:
            return None
        u = users[0]
        return u.get("id")


@router.post("/orgs", response_model=OrgResponse)
def create_org(payload: OrgCreateRequest, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()

    created = sb.table("organizations").insert({"name": payload.name}).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Failed to create org")
    org = created.data[0]

    # Defense-in-depth: API seeds core; DB trigger also seeds.
    sb.table("org_modules").upsert(
        {"org_id": org["id"], "module_key": "core", "is_enabled": True},
        on_conflict="org_id,module_key",
    ).execute()

    return org


@router.get("/orgs", response_model=list[OrgResponse])
def list_orgs(user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()
    res = sb.table("organizations").select("*").order("created_at", desc=True).execute()
    return res.data or []


@router.patch("/orgs/{org_id}", response_model=OrgResponse)
def update_org(org_id: str, payload: OrgUpdateRequest, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()

    patch: dict[str, Any] = {}
    if payload.name is not None:
        patch["name"] = payload.name
    if payload.status is not None:
        patch["status"] = payload.status
    if not patch:
        cur = sb.table("organizations").select("*").eq("id", org_id).single().execute()
        return cur.data

    res = sb.table("organizations").update(patch).eq("id", org_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Org not found")
    return res.data[0]


@router.get("/orgs/{org_id}/members", response_model=list[MemberResponse])
def list_members(org_id: str, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()
    res = sb.table("org_members").select("*").eq("org_id", org_id).order("created_at", desc=False).execute()
    return res.data or []


@router.post("/orgs/{org_id}/members", response_model=MemberResponse)
def add_member(org_id: str, payload: MemberAddRequest, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()

    uid = payload.user_id
    if not uid and payload.email:
        uid = _get_user_id_by_email(payload.email)
    if not uid:
        raise HTTPException(status_code=400, detail="Provide user_id or existing user email")

    res = sb.table("org_members").insert({"org_id": org_id, "user_id": uid, "role": payload.role}).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to add member (maybe already exists)")
    return res.data[0]


@router.patch("/orgs/{org_id}/members/{member_id}", response_model=MemberResponse)
def update_member(org_id: str, member_id: str, payload: MemberUpdateRequest, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()
    res = (
        sb.table("org_members")
        .update({"role": payload.role})
        .eq("id", member_id)
        .eq("org_id", org_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Member not found")
    return res.data[0]


@router.delete("/orgs/{org_id}/members/{member_id}")
def remove_member(org_id: str, member_id: str, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()
    res = sb.table("org_members").delete().eq("id", member_id).eq("org_id", org_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}


@router.get("/orgs/{org_id}/modules", response_model=list[ModuleFlag])
def get_org_modules(org_id: str, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()

    mods = sb.table("modules").select("key,name").order("key", desc=False).execute().data or []
    flags = sb.table("org_modules").select("module_key,is_enabled").eq("org_id", org_id).execute().data or []
    flag_map = {f["module_key"]: bool(f["is_enabled"]) for f in flags}

    out = []
    for m in mods:
        k = m["key"]
        out.append({"key": k, "name": m["name"], "is_enabled": True if k == "core" else flag_map.get(k, False)})
    return out


@router.patch("/orgs/{org_id}/modules", response_model=list[ModuleFlag])
def patch_org_modules(org_id: str, payload: ModulesPatchRequest, user: AuthedUser = Depends(verify_jwt)) -> Any:
    _require_system_admin(user)
    sb = get_service_client()

    rows = []
    for u in payload.updates:
        if u.module_key == "core" and not u.is_enabled:
            raise HTTPException(status_code=400, detail="core is locked ON")
        rows.append({"org_id": org_id, "module_key": u.module_key, "is_enabled": True if u.module_key == "core" else u.is_enabled})

    if rows:
        sb.table("org_modules").upsert(rows, on_conflict="org_id,module_key").execute()

    return get_org_modules(org_id, user)
