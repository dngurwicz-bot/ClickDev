"""CLICK Actions service layer."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
import os
from supabase import create_client

try:
    from database import supabase_admin  # pylint: disable=import-error
except ModuleNotFoundError:  # pragma: no cover - test/runtime path fallback
    from backend.database import supabase_admin  # type: ignore


ACTION_CATALOG: List[Dict[str, Any]] = [
    {
        "action_key": "employee_profile.created",
        "label": "יצירת תיק עובד",
        "entity": "employee",
        "payload_schema": {
            "employee_number": "string",
            "id_number": "string",
            "first_name_he": "string",
            "last_name_he": "string",
            "father_name_he": "string?",
            "birth_date": "date",
        },
    },
    {
        "action_key": "employee_identity.amended",
        "label": "עדכון פרטי זהות",
        "entity": "employee",
        "payload_schema": {
            "first_name_he": "string?",
            "last_name_he": "string?",
            "father_name_he": "string?",
            "birth_date": "date?",
        },
    },
    {
        "action_key": "employee_address.changed",
        "label": "שינוי כתובת",
        "entity": "employee_address",
        "payload_schema": {
            "city_name": "string?",
            "city_code": "string?",
            "street": "string?",
            "house_number": "string?",
            "apartment": "string?",
            "entrance": "string?",
            "postal_code": "string?",
            "phone": "string?",
            "phone_additional": "string?",
            "valid_to": "date?",
            "id": "uuid?",
        },
    },
    {
        "action_key": "employee_family.changed",
        "label": "שינוי משפחה/ילדים",
        "entity": "employee_children",
        "payload_schema": {
            "first_name": "string?",
            "last_name": "string?",
            "id_number": "string?",
            "birth_date": "date?",
            "gender": "M|F|Other?",
            "valid_to": "date?",
            "id": "uuid?",
        },
    },
    {
        "action_key": "employee_bank.changed",
        "label": "שינוי בנק",
        "entity": "employee_bank_details",
        "payload_schema": {
            "bank_code": "string?",
            "branch_code": "string?",
            "account_number": "string?",
            "account_owner_name": "string?",
            "valid_to": "date?",
            "id": "uuid?",
        },
    },
    {
        "action_key": "employee_role.changed",
        "label": "שינוי תפקיד ושיבוץ",
        "entity": "employee_role_history",
        "payload_schema": {
            "org_unit_id": "uuid?",
            "job_title": "string?",
            "job_grade_id": "uuid?",
            "rank": "string?",
            "scope_percentage": "number?",
            "valid_to": "date?",
            "id": "uuid?",
        },
    },
    {
        "action_key": "employee_asset.changed",
        "label": "שינוי נכס",
        "entity": "employee_assets",
        "payload_schema": {
            "type": "string?",
            "description": "string?",
            "status": "string?",
            "serial_number": "string?",
            "issued_date": "date?",
            "return_date": "date?",
            "valid_to": "date?",
            "id": "uuid?",
        },
    },
    {
        "action_key": "employee_status.closed",
        "label": "סגירת תיק עובד",
        "entity": "employee",
        "payload_schema": {
            "closed_reason": "string?",
        },
    },
]

TEMPORAL_ENTITY_CONFIG: Dict[str, Dict[str, Any]] = {
    "employee_address.changed": {
        "table": "employee_address",
        "fields": [
            "city_name",
            "city_code",
            "street",
            "house_number",
            "apartment",
            "entrance",
            "postal_code",
            "phone",
            "phone_additional",
        ],
    },
    "employee_family.changed": {
        "table": "employee_children",
        "fields": ["first_name", "last_name", "id_number", "birth_date", "gender"],
    },
    "employee_bank.changed": {
        "table": "employee_bank_details",
        "fields": ["bank_code", "branch_code", "account_number", "account_owner_name"],
    },
    "employee_role.changed": {
        "table": "employee_role_history",
        "fields": ["org_unit_id", "job_title", "job_grade_id", "rank", "scope_percentage"],
    },
    "employee_asset.changed": {
        "table": "employee_assets",
        "fields": ["type", "description", "status", "serial_number", "issued_date", "return_date"],
    },
}


class ClickActionService:
    """Service for dispatching unique CLICK actions."""

    def get_action_catalog(self) -> List[Dict[str, Any]]:
        return ACTION_CATALOG

    def get_employee_file(
        self,
        org_id: str,
        employee_id: str,
        timeline_limit: int = 100,
        user_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = self._client(user_token)
        org_id, employee_id = self._resolve_employee_context(client, org_id, employee_id)
        employee = self._select_single(
            client,
            "employees",
            org_id,
            employee_id,
            order_by=None,
            filters=[("id", "eq", employee_id)],
        )
        if employee is None:
            raise HTTPException(status_code=404, detail="Employee not found")

        return {
            "employee": employee,
            "addresses": self._select_temporal(client, "employee_address", org_id, employee_id),
            "children": self._select_temporal(client, "employee_children", org_id, employee_id),
            "bank_details": self._select_temporal(client, "employee_bank_details", org_id, employee_id),
            "role_history": self._select_temporal(client, "employee_role_history", org_id, employee_id),
            "assets": self._select_temporal(client, "employee_assets", org_id, employee_id),
            "timeline": self._select_timeline(client, org_id, employee_id, timeline_limit),
        }

    def dispatch_action(
        self,
        org_id: str,
        employee_id: str,
        action_key: str,
        effective_at: date,
        payload: Dict[str, Any],
        request_id: str,
        user_id: str,
        user_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = self._client(user_token)
        org_id, employee_id = self._resolve_employee_context(client, org_id, employee_id)

        catalog_item = next((item for item in ACTION_CATALOG if item["action_key"] == action_key), None)
        if catalog_item is None:
            raise HTTPException(status_code=400, detail=f"Unsupported action_key: {action_key}")
        if not request_id:
            raise HTTPException(status_code=400, detail="request_id is required")

        if action_key == "employee_profile.created":
            return self.create_employee_profile_action(
                org_id=org_id,
                payload=payload,
                effective_at=effective_at,
                request_id=request_id,
                user_id=user_id,
                user_token=user_token,
            )

        existing = self._find_journal_entry(client, org_id, employee_id, request_id)
        if existing:
            return {
                "action_id": existing["id"],
                "applied": False,
                "new_snapshot_version": existing["created_at"],
                "idempotent_replay": True,
            }

        before_snapshot = self.get_employee_file(org_id, employee_id, timeline_limit=20, user_token=user_token)
        self._apply_action(client, org_id, employee_id, action_key, effective_at, payload, user_id)
        after_snapshot = self.get_employee_file(org_id, employee_id, timeline_limit=20, user_token=user_token)

        journal_row = {
            "organization_id": org_id,
            "employee_id": employee_id,
            "action_key": action_key,
            "action_version": 1,
            "effective_at": effective_at.isoformat(),
            "payload_json": payload or {},
            "snapshot_before_json": before_snapshot,
            "snapshot_after_json": after_snapshot,
            "correlation_id": request_id,
            "created_by": user_id,
        }
        inserted = client.table("employee_action_journal").insert(journal_row).execute()
        action_id = inserted.data[0]["id"] if inserted.data else None

        return {
            "action_id": action_id,
            "applied": True,
            "new_snapshot_version": datetime.utcnow().isoformat(),
            "idempotent_replay": False,
        }

    def create_employee_profile_action(
        self,
        org_id: str,
        payload: Dict[str, Any],
        effective_at: date,
        request_id: str,
        user_id: str,
        user_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = self._client(user_token)
        employee_number = payload.get("employee_number")
        id_number = payload.get("id_number")
        if not employee_number or not id_number:
            raise HTTPException(status_code=400, detail="employee_number and id_number are required")

        existing_employee = (
            client.table("employees")
            .select("id")
            .eq("organization_id", org_id)
            .eq("id_number", id_number)
            .limit(1)
            .execute()
        ).data or []

        employee_id: str
        if existing_employee:
            employee_id = existing_employee[0]["id"]
            self._update_employee(
                client,
                org_id,
                employee_id,
                {
                    "employee_number": employee_number,
                    "first_name_he": payload.get("first_name_he"),
                    "last_name_he": payload.get("last_name_he"),
                    "father_name_he": payload.get("father_name_he"),
                    "birth_date": payload.get("birth_date"),
                    "is_active": True,
                    "deleted_at": None,
                },
            )
        else:
            insert_payload = {
                "organization_id": org_id,
                "employee_number": employee_number,
                "id_number": id_number,
                "first_name_he": payload.get("first_name_he"),
                "last_name_he": payload.get("last_name_he"),
                "father_name_he": payload.get("father_name_he"),
                "birth_date": payload.get("birth_date"),
                "created_by": user_id,
                "is_active": True,
            }
            response = client.table("employees").insert(insert_payload).execute()
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create employee")
            employee_id = response.data[0]["id"]

        existing = self._find_journal_entry(client, org_id, employee_id, request_id)
        if existing:
            return {
                "action_id": existing["id"],
                "employee_id": employee_id,
                "applied": False,
                "new_snapshot_version": existing["created_at"],
                "idempotent_replay": True,
            }

        after_snapshot = self.get_employee_file(org_id, employee_id, timeline_limit=20, user_token=user_token)
        journal_row = {
            "organization_id": org_id,
            "employee_id": employee_id,
            "action_key": "employee_profile.created",
            "action_version": 1,
            "effective_at": effective_at.isoformat(),
            "payload_json": payload or {},
            "snapshot_before_json": None,
            "snapshot_after_json": after_snapshot,
            "correlation_id": request_id,
            "created_by": user_id,
        }
        inserted = client.table("employee_action_journal").insert(journal_row).execute()
        action_id = inserted.data[0]["id"] if inserted.data else None

        return {
            "action_id": action_id,
            "employee_id": employee_id,
            "applied": True,
            "new_snapshot_version": datetime.utcnow().isoformat(),
            "idempotent_replay": False,
        }

    def _apply_action(
        self,
        client,
        org_id: str,
        employee_id: str,
        action_key: str,
        effective_at: date,
        payload: Dict[str, Any],
        user_id: str,
    ) -> None:
        if action_key == "employee_profile.created":
            # Profile creation stays compatible with existing core table.
            update_data = {
                "employee_number": payload.get("employee_number"),
                "id_number": payload.get("id_number"),
                "first_name_he": payload.get("first_name_he"),
                "last_name_he": payload.get("last_name_he"),
                "father_name_he": payload.get("father_name_he"),
                "birth_date": payload.get("birth_date"),
            }
            clean_data = {k: v for k, v in update_data.items() if v is not None}
            if clean_data:
                self._update_employee(client, org_id, employee_id, clean_data)
            return

        if action_key == "employee_identity.amended":
            allowed = ["first_name_he", "last_name_he", "father_name_he", "birth_date"]
            update_data = {k: payload[k] for k in allowed if k in payload}
            if update_data:
                self._update_employee(client, org_id, employee_id, update_data)
            return

        if action_key == "employee_status.closed":
            self._update_employee(
                client,
                org_id,
                employee_id,
                {
                    "is_active": False,
                    "deleted_at": datetime.utcnow().isoformat(),
                },
            )
            return

        if action_key in TEMPORAL_ENTITY_CONFIG:
            self._apply_temporal_change(client, org_id, employee_id, action_key, effective_at, payload, user_id)
            return

        raise HTTPException(status_code=400, detail=f"No handler for action_key: {action_key}")

    def _apply_temporal_change(
        self,
        client,
        org_id: str,
        employee_id: str,
        action_key: str,
        effective_at: date,
        payload: Dict[str, Any],
        user_id: str,
    ) -> None:
        config = TEMPORAL_ENTITY_CONFIG[action_key]
        table_name = config["table"]
        allowed_fields = config["fields"]
        record_id = payload.get("id")
        requested_valid_to = _parse_date(payload.get("valid_to") or payload.get("return_date"))

        rows = (
            client.table(table_name)
            .select("*")
            .eq("organization_id", org_id)
            .eq("employee_id", employee_id)
            .order("valid_from")
            .execute()
        ).data or []

        exact_row = next((row for row in rows if row.get("valid_from") == effective_at.isoformat()), None)
        if record_id:
            target = next((row for row in rows if row.get("id") == record_id), None)
            if target and target.get("valid_from") == effective_at.isoformat():
                exact_row = target

        next_future = self._next_future_start(rows, effective_at)
        computed_valid_to = requested_valid_to
        if next_future and (computed_valid_to is None or computed_valid_to >= next_future):
            computed_valid_to = next_future - timedelta(days=1)
        if computed_valid_to and computed_valid_to < effective_at:
            raise HTTPException(status_code=400, detail="valid_to cannot be earlier than effective_at")

        temporal_payload = {k: payload[k] for k in allowed_fields if k in payload}
        if table_name == "employee_assets":
            if "issued_date" not in temporal_payload:
                temporal_payload["issued_date"] = effective_at.isoformat()
            temporal_payload["return_date"] = (computed_valid_to.isoformat() if computed_valid_to else payload.get("return_date"))

        if exact_row:
            update_data = {
                **temporal_payload,
                "valid_to": computed_valid_to.isoformat() if computed_valid_to else None,
            }
            if "changed_by" in exact_row:
                update_data["changed_by"] = user_id
            if "updated_at" in exact_row:
                update_data["updated_at"] = datetime.utcnow().isoformat()
            client.table(table_name).update(update_data).eq("id", exact_row["id"]).execute()
            return

        covering_row = self._find_covering_row(rows, effective_at)
        if covering_row:
            client.table(table_name).update(
                {"valid_to": (effective_at - timedelta(days=1)).isoformat()}
            ).eq("id", covering_row["id"]).execute()

        insert_data: Dict[str, Any] = {
            "organization_id": org_id,
            "employee_id": employee_id,
            "valid_from": effective_at.isoformat(),
            "valid_to": computed_valid_to.isoformat() if computed_valid_to else None,
            **temporal_payload,
        }
        if table_name == "employee_children":
            insert_data.setdefault("first_name", "")
            insert_data.setdefault("last_name", "")
            insert_data.setdefault("gender", "M")
        if table_name == "employee_bank_details":
            insert_data.setdefault("bank_code", "")
            insert_data.setdefault("branch_code", "")
            insert_data.setdefault("account_number", "")
            insert_data.setdefault("account_owner_name", "")
        if table_name == "employee_role_history":
            insert_data.setdefault("job_title", "")
            insert_data.setdefault("rank", "")
            insert_data.setdefault("scope_percentage", 100)
        if table_name == "employee_assets":
            insert_data.setdefault("type", "")
            insert_data.setdefault("description", "")
            insert_data.setdefault("status", "Assigned")
        if table_name == "employee_assets":
            insert_data["issued_date"] = temporal_payload.get("issued_date", effective_at.isoformat())
            insert_data["return_date"] = temporal_payload.get("return_date")
        if table_name == "employee_address":
            insert_data["changed_by"] = user_id

        client.table(table_name).insert(insert_data).execute()

    def _update_employee(self, client, org_id: str, employee_id: str, update_data: Dict[str, Any]) -> None:
        response = (
            client.table("employees")
            .update(update_data)
            .eq("organization_id", org_id)
            .eq("id", employee_id)
            .execute()
        )
        if response.data is None:
            raise HTTPException(status_code=404, detail="Employee not found")

    def _select_temporal(self, client, table_name: str, org_id: str, employee_id: str) -> List[Dict[str, Any]]:
        return (
            client.table(table_name)
            .select("*")
            .eq("organization_id", org_id)
            .eq("employee_id", employee_id)
            .order("valid_from", desc=True)
            .execute()
        ).data or []

    def _select_timeline(self, client, org_id: str, employee_id: str, limit: int) -> List[Dict[str, Any]]:
        return (
            client.table("employee_action_journal")
            .select("*")
            .eq("organization_id", org_id)
            .eq("employee_id", employee_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        ).data or []

    def _select_single(
        self,
        client,
        table_name: str,
        org_id: str,
        employee_id: str,
        order_by: Optional[str],
        filters: Optional[List[tuple]],
    ) -> Optional[Dict[str, Any]]:
        query = client.table(table_name).select("*").eq("organization_id", org_id)
        if table_name != "employees":
            query = query.eq("employee_id", employee_id)
        for field, operator, value in (filters or []):
            if operator == "eq":
                query = query.eq(field, value)
        if order_by:
            query = query.order(order_by, desc=True)
        data = query.limit(1).execute().data or []
        return data[0] if data else None

    def _find_journal_entry(self, client, org_id: str, employee_id: str, request_id: str) -> Optional[Dict[str, Any]]:
        rows = (
            client.table("employee_action_journal")
            .select("*")
            .eq("organization_id", org_id)
            .eq("employee_id", employee_id)
            .eq("correlation_id", request_id)
            .limit(1)
            .execute()
        ).data or []
        return rows[0] if rows else None

    def _resolve_employee_context(self, client, org_id: str, employee_identifier: str) -> tuple[str, str]:
        """Accept UUID id or employee_number and return canonical (organization_id, employee_id)."""
        if not employee_identifier:
            raise HTTPException(status_code=404, detail="Employee not found")

        ident = str(employee_identifier).strip()

        by_id_in_org = (
            client.table("employees")
            .select("id, organization_id")
            .eq("organization_id", org_id)
            .eq("id", ident)
            .limit(1)
            .execute()
        ).data or []
        if by_id_in_org:
            row = by_id_in_org[0]
            return row["organization_id"], row["id"]

        by_num_in_org = (
            client.table("employees")
            .select("id, organization_id")
            .eq("organization_id", org_id)
            .eq("employee_number", ident)
            .limit(1)
            .execute()
        ).data or []
        if by_num_in_org:
            row = by_num_in_org[0]
            return row["organization_id"], row["id"]

        by_id_global = (
            client.table("employees")
            .select("id, organization_id")
            .eq("id", ident)
            .limit(1)
            .execute()
        ).data or []
        if by_id_global:
            row = by_id_global[0]
            return row["organization_id"], row["id"]

        by_num_global = (
            client.table("employees")
            .select("id, organization_id")
            .eq("employee_number", ident)
            .limit(2)
            .execute()
        ).data or []
        if len(by_num_global) == 1:
            row = by_num_global[0]
            return row["organization_id"], row["id"]

        raise HTTPException(status_code=404, detail=f"Employee not found: {ident}")

    @staticmethod
    def _client(user_token: Optional[str]):
        if user_token:
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_API_KEY", "")
            client = create_client(supabase_url, supabase_key)
            client.postgrest.auth(user_token)
            return client
        return supabase_admin

    @staticmethod
    def _find_covering_row(rows: List[Dict[str, Any]], target_date: date) -> Optional[Dict[str, Any]]:
        for row in rows:
            row_start = _parse_date(row.get("valid_from"))
            row_end = _parse_date(row.get("valid_to"))
            if row_start and row_start < target_date and (row_end is None or row_end >= target_date):
                return row
        return None

    @staticmethod
    def _next_future_start(rows: List[Dict[str, Any]], target_date: date) -> Optional[date]:
        future_dates = []
        for row in rows:
            row_start = _parse_date(row.get("valid_from"))
            if row_start and row_start > target_date:
                future_dates.append(row_start)
        return min(future_dates) if future_dates else None


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)).date()
