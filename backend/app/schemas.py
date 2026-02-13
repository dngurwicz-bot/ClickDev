from typing import Literal, Optional

from pydantic import BaseModel, Field


OrgStatus = Literal["active", "suspended"]
OrgRole = Literal["org_admin", "hr", "manager", "employee"]
ModuleKey = Literal["core", "flow", "docs", "assets", "vibe", "grow", "vision", "insights"]


class MeMembership(BaseModel):
    org_id: str
    role: OrgRole


class MeResponse(BaseModel):
    user_id: str
    email: Optional[str] = None
    is_system_admin: bool
    memberships: list[MeMembership]
    default_org_id: Optional[str] = None


class OrgCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class OrgUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    status: Optional[OrgStatus] = None


class OrgResponse(BaseModel):
    id: str
    name: str
    status: OrgStatus
    created_at: str


class MemberAddRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: OrgRole


class MemberResponse(BaseModel):
    id: str
    org_id: str
    user_id: str
    role: OrgRole
    created_at: str


class MemberUpdateRequest(BaseModel):
    role: OrgRole


class ModuleFlag(BaseModel):
    key: ModuleKey
    name: str
    is_enabled: bool


class ModulesPatchItem(BaseModel):
    module_key: ModuleKey
    is_enabled: bool


class ModulesPatchRequest(BaseModel):
    updates: list[ModulesPatchItem]

