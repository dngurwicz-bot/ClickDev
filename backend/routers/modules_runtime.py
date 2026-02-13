"""Module runtime and feature flag management."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin  # pylint: disable=import-error
from dependencies import get_current_user  # pylint: disable=import-error
from routers._org_access import assert_org_access, assert_org_admin  # pylint: disable=import-error

router = APIRouter(prefix="/api/organizations/{org_id}/modules", tags=["Modules Runtime"])


@router.get("/registry")
async def get_module_registry(_user=Depends(get_current_user)):
    try:
        resp = supabase_admin.table("module_registry").select("*").eq("is_active", True).order("module_key").execute()
        return {"items": resp.data or []}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/flags")
async def get_org_module_flags(org_id: str, user=Depends(get_current_user)):
    try:
        assert_org_access(org_id, user.id)
        flags = supabase_admin.table("org_module_flags").select("*") \
            .eq("organization_id", org_id).order("module_key").execute()
        features = supabase_admin.table("feature_flags").select("*") \
            .eq("organization_id", org_id).order("flag_key").execute()
        return {"module_flags": flags.data or [], "feature_flags": features.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.put("/flags/{module_key}")
async def upsert_org_module_flag(org_id: str, module_key: str, body: dict, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)
        payload = {
            "organization_id": org_id,
            "module_key": module_key,
            "enabled": bool(body.get("enabled", False)),
            "config_json": body.get("config_json", {}),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase_admin.table("org_module_flags").upsert(payload, on_conflict="organization_id,module_key").execute()
        return result.data[0] if result.data else payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.put("/features/{flag_key}")
async def upsert_feature_flag(org_id: str, flag_key: str, body: dict, user=Depends(get_current_user)):
    try:
        assert_org_admin(org_id, user.id)
        payload = {
            "organization_id": org_id,
            "module_key": body.get("module_key"),
            "flag_key": flag_key,
            "enabled": bool(body.get("enabled", False)),
            "rollout_percentage": int(body.get("rollout_percentage", 100)),
            "config_json": body.get("config_json", {}),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase_admin.table("feature_flags").upsert(
            payload,
            on_conflict="organization_id,module_key,flag_key"
        ).execute()
        return result.data[0] if result.data else payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/entitlements")
async def get_entitlements(org_id: str, user=Depends(get_current_user)):
    try:
        assert_org_access(org_id, user.id)
        org_resp = supabase_admin.table("organizations").select("active_modules, subscription_tier").eq("id", org_id).limit(1).execute()
        if not org_resp.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        org = org_resp.data[0]
        active_modules = org.get("active_modules") or ["core"]

        flags_resp = supabase_admin.table("org_module_flags").select("module_key, enabled") \
            .eq("organization_id", org_id).execute()
        flag_map = {x["module_key"]: x["enabled"] for x in (flags_resp.data or [])}

        enabled_modules = []
        for mod in active_modules:
            enabled_modules.append({
                "module_key": mod,
                "enabled": flag_map.get(mod, True),
            })

        return {
            "organization_id": org_id,
            "subscription_tier": org.get("subscription_tier", "basic"),
            "modules": enabled_modules,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
