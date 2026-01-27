"""
Logic module for handling temporal event processing (Hilan style).
"""
from supabase import Client


class TemporalEngine:
    """
    Handles temporal logic for Hilan-style events (Type C/P).
    Manages validity periods (valid_from/valid_to) and retroactive updates.
    """

    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    async def handle_event(self,
                           event_code: int,
                           employee_id: str,
                           new_record: dict,
                           action_code: str = 'A') -> dict:
        """
        Main entry point for processing an event.

        Args:
            event_code: The Hilan Event Code (e.g., 203, 201)
            employee_id: UUID of the employee
            new_record: Dictionary containing the new data for this event
            action_code: 'A' (Insert/Update), '3' (Cancel/Delete)
        """

        table_name = self._get_table_for_event(event_code)

        if action_code == 'A':
            return await self._insert_type_c_record(table_name,
                                                    employee_id,
                                                    new_record)
        elif action_code == '3':
            # Implement logic for cancellation
            pass

        return {"status": "error", "message": "Unknown action code"}

    def _get_table_for_event(self, event_code: int) -> str:
        # Mapping Event Codes to DB Tables
        mapping = {
            201: "employee_status",    # Status Changes
            203: "employee_ranks",     # Rank/Role Changes
            204: "employee_splits",    # Cost Center Splits
            205: "employee_tax"       # Tax Parameters
        }
        return mapping.get(event_code, "generic_events")

    async def _insert_type_c_record(self,
                                    table: str,
                                    employee_id: str,
                                    new_record: dict) -> dict:
        """
        Implements 'Type C' Logic:
        1. Find the record effective immediately BEFORE the new record.
        2. Close it (set valid_to = new_record.valid_from).
        3. Insert the new record.
        """
        valid_from = new_record.get('valid_from')

        # 1. Close Previous Record
        # Find record where valid_from < new_valid_from AND
        # (valid_to is NULL OR valid_to > new_valid_from)

        # Note: In a real temporal system, splitting an existing interval
        # might be needed if the new record is inserted in the middle of
        # an existing range. For now, we assume strict "Type C" (Append/Cut).

        previous = self.supabase.table(table)\
            .select("id")\
            .eq("employee_id", employee_id)\
            .lt("valid_from", valid_from)\
            .is_("valid_to", "null")\
            .execute()

        if previous.data:
            # Close the last active record
            for record in previous.data:
                self.supabase.table(table).update({
                    "valid_to": valid_from
                }).eq("id", record['id']).execute()

        # 2. Insert New Record
        new_record['employee_id'] = employee_id
        new_record['valid_to'] = None  # Active until further notice

        res = self.supabase.table(table).insert(new_record).execute()
        return res.data[0] if res.data else {}
