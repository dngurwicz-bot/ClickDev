"""
Data Migration Script: employee_history -> Event Tables

This script migrates data from the legacy employee_history table
to the new event-specific tables (event_101, event_102, etc.).

Run this AFTER all event tables are created but BEFORE switching frontend to new API.
"""

import sys
from datetime import datetime, timedelta
from backend.database import supabase_admin

# Mapping of event_code to table names and field mappings
EVENT_MAPPINGS = {
    "101": {
        "table": "event_101_identification",
        "fields": {
            "id_number": "id_number",
            "employee_number": "employee_number",
            "birth_date": "birth_date",
        }
    },
    "104": {
        "table": "event_104_personal_status",
        "fields": {
            "marital_status": "marital_status",
            "gender": "gender",
            "nationality": "nationality",
            "birth_country": "birth_country",
            "passport_number": "passport_number",
        }
    },
    "105": {
        "table": "event_105_names",
        "fields": {
            "first_name": "first_name",
            "last_name": "last_name",
            "first_name_en": "first_name_en",
            "last_name_en": "last_name_en",
            "prev_first_name": "prev_first_name",
            "prev_last_name": "prev_last_name",
        }
    },
    "102": {
        "table": "event_102_contact",
        "fields": {
            "phone": "phone",
            "mobile": "mobile",
            "email": "email",
            "address": "address",
            "city": "city",
        }
    },
    "103": {
        "table": "event_103_military",
        "fields": {
            "army_status": "army_status",
            "army_release_date": "army_release_date",
        }
    },
}


def migrate_data():
    """Main migration function"""
    print("🚀 Starting data migration from employee_history to event tables...")
    
    try:
        # Fetch all records from employee_history
        response = supabase_admin.table("employee_history").select("*").execute()
        records = response.data
        
        print(f"\n📊 Found {len(records)} records in employee_history")
        
        if not records:
            print("No data to migrate")
            return
        
        # Group records by employee_id and event_code
        grouped = {}
        for record in records:
            emp_id = record.get("employee_id")
            event_code = record.get("event_code")
            
            if not emp_id or not event_code:
                continue
            
            key = (emp_id, event_code)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(record)
        
        # Migrate each group
        total_migrated = 0
        total_failed = 0
        
        for (emp_id, event_code), recs in grouped.items():
            if event_code not in EVENT_MAPPINGS:
                print(f"⚠️  Skipping unknown event code: {event_code}")
                continue
            
            config = EVENT_MAPPINGS[event_code]
            table = config["table"]
            fields = config["fields"]
            
            # Sort records by valid_from to maintain order
            recs_sorted = sorted(recs, key=lambda r: r.get("valid_from", ""))
            
            for record in recs_sorted:
                try:
                    # Build the new record
                    new_record = {
                        "employee_id": emp_id,
                        "organization_id": record.get("organization_id"),
                        "valid_from": record.get("valid_from"),
                        "valid_to": record.get("valid_to"),
                        "action_code": " ",  # Default to 'Add'
                        "created_by": record.get("changed_by"),
                        "changed_by": record.get("changed_by"),
                        "change_reason": "Migrated from employee_history",
                        "created_at": record.get("created_at", datetime.utcnow().isoformat()),
                    }
                    
                    # Copy relevant fields
                    for new_field, old_field in fields.items():
                        if record.get(old_field):
                            new_record[new_field] = record.get(old_field)
                    
                    # Insert into new table
                    response = supabase_admin.table(table).insert(new_record).execute()
                    
                    if response.data:
                        total_migrated += 1
                        print(f"✅ Migrated {event_code} for employee {emp_id}")
                    else:
                        total_failed += 1
                        print(f"❌ Failed to migrate {event_code} for employee {emp_id}")
                
                except Exception as e:
                    total_failed += 1
                    print(f"❌ Error migrating record: {str(e)}")
        
        print(f"\n📈 Migration Summary:")
        print(f"   ✅ Successfully migrated: {total_migrated} records")
        print(f"   ❌ Failed: {total_failed} records")
        print(f"   Total: {total_migrated + total_failed} records")
        
        if total_failed == 0:
            print("\n✨ Migration completed successfully!")
            return True
        else:
            print(f"\n⚠️  Migration completed with {total_failed} errors")
            return False
    
    except Exception as e:
        print(f"\n💥 Migration failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def validate_migration():
    """Validate that migration was successful"""
    print("\n🔍 Validating migration...")
    
    try:
        validation_passed = True
        
        for event_code, config in EVENT_MAPPINGS.items():
            table = config["table"]
            
            # Count records in new table
            response = supabase_admin.table(table).select("id", count="exact").execute()
            count = response.count if hasattr(response, 'count') else len(response.data)
            
            print(f"   Event {event_code} ({table}): {count} records")
            
            if count == 0:
                print(f"   ⚠️  No records found in {table}")
                validation_passed = False
        
        return validation_passed
    
    except Exception as e:
        print(f"Validation error: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("HILAN Pro Event Data Migration")
    print("=" * 60)
    
    # Run migration
    success = migrate_data()
    
    # Validate
    if success:
        validate_migration()
    
    sys.exit(0 if success else 1)
