"""Shared org access helpers for routers."""
from fastapi import HTTPException
from database import supabase_admin  # pylint: disable=import-error


def assert_org_access(org_id: str, user_id: str):
    membership = supabase_admin.table("organization_members").select("organization_id") \
        .eq("user_id", user_id).eq("organization_id", org_id).limit(1).execute()
    if membership.data:
        return

    roles = supabase_admin.table("user_roles").select("organization_id") \
        .eq("user_id", user_id).eq("organization_id", org_id).limit(1).execute()
    if roles.data:
        return

    raise HTTPException(status_code=403, detail="Access denied for organization")


def assert_org_admin(org_id: str, user_id: str):
    roles = supabase_admin.table("user_roles").select("role") \
        .eq("user_id", user_id).eq("organization_id", org_id) \
        .in_("role", ["super_admin", "organization_admin"]).limit(1).execute()
    if roles.data:
        return

    raise HTTPException(status_code=403, detail="Admin access required")
