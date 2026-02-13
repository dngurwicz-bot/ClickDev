"""Pydantic schemas for Priority-like UI shell endpoints."""
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class UiHomeLayoutUpdateRequest(BaseModel):
    widgets_json: Dict[str, Any] = Field(default_factory=dict)


class ShortcutGroupCreateRequest(BaseModel):
    name: str
    display_order: int = 0


class ShortcutCreateRequest(BaseModel):
    group_id: str
    entity_type: str
    entity_key: Optional[str] = None
    label: str
    route: str
    display_order: int = 0


class ShortcutUpdateRequest(BaseModel):
    label: Optional[str] = None
    route: Optional[str] = None
    display_order: Optional[int] = None


class SavedSearchCreateRequest(BaseModel):
    screen_key: str
    name: str
    filters_json: Dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False


class SavedSearchUpdateRequest(BaseModel):
    name: Optional[str] = None
    filters_json: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    touch_last_used: bool = False


class ActiveScreenHeartbeatRequest(BaseModel):
    session_id: str
    route: str
    screen_key: Optional[str] = None
    title: Optional[str] = None
