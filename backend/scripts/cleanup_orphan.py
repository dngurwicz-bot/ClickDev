"""
Script to clean up orphaned employee records from the database.
Handles soft-deletion logic if necessary, otherwise hard-deletes.
"""
import os
import sys

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import supabase_admin  # noqa: E402


def delete_orphan_employee(id_number: str):
    """
    Deletes an employee and their associated history by ID Number.

    Args:
        id_number: The Israeli ID number (Teudat Zeut) of the employee.
    """
    print(f"Attempting to delete employee with ID Number: {id_number}")

    # 1. Find the UUID
    res = supabase_admin.table("employees")\
        .select("id")\
        .eq("id_number", id_number)\
        .execute()

    if not res.data:
        print("Employee not found.")
        return

    emp_id = res.data[0]['id']
    print(f"Found Employee UUID: {emp_id}")

    # 2. Delete History first (if any exists - likely none or partial)
    supabase_admin.table("employee_history")\
        .delete()\
        .eq("employee_id", emp_id)\
        .execute()
    print("Deleted associated history records.")

    # 3. Delete Employee
    supabase_admin.table("employees")\
        .delete()\
        .eq("id", emp_id)\
        .execute()
    print("Deleted employee record.")
    print("Cleanup complete. You can now retry the creation.")


if __name__ == "__main__":
    # The ID from the user's error message
    TARGET_ID = "313842650"
    delete_orphan_employee(TARGET_ID)
