from fastapi import APIRouter, Depends, HTTPException

from app.core.security import AuthedUser, verify_jwt
from app.core.supabase import get_service_client
from app.schemas import MeMembership, MeResponse

router = APIRouter()


@router.get("/me", response_model=MeResponse)
def me(user: AuthedUser = Depends(verify_jwt)) -> MeResponse:
    try:
        sb = get_service_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    sa = sb.table("system_admins").select("user_id").eq("user_id", user.user_id).execute()
    is_system_admin = bool(sa.data)

    mem = (
        sb.table("org_members")
        .select("org_id,role,created_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=False)
        .execute()
    )

    memberships = [MeMembership(org_id=r["org_id"], role=r["role"]) for r in (mem.data or [])]
    default_org_id = memberships[0].org_id if memberships else None

    return MeResponse(
        user_id=user.user_id,
        email=user.email,
        is_system_admin=is_system_admin,
        memberships=memberships,
        default_org_id=default_org_id,
    )
