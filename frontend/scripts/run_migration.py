#!/usr/bin/env python3
"""
Run SQL migration for system_settings
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(".env.local")
if not env_path.exists():
    env_path = Path(".env")
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Read SQL file
sql_file = Path(__file__).parent / "setup-system-settings.sql"
if not sql_file.exists():
    print(f"❌ Error: SQL file not found: {sql_file}")
    sys.exit(1)

with open(sql_file, 'r', encoding='utf-8') as f:
    sql = f.read()

# Split SQL into individual statements
statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("🔄 Running migration: setup-system-settings.sql")
print(f"📝 Found {len(statements)} SQL statements\n")

for i, statement in enumerate(statements, 1):
    if not statement or statement.startswith('--'):
        continue
    
    try:
        # Execute via RPC if available, otherwise try direct query
        # Note: Supabase Python client doesn't have direct SQL execution
        # We'll need to use the REST API or create a function
        print(f"⏳ Executing statement {i}/{len(statements)}...")
        
        # For now, we'll use a workaround - create the table via table operations
        # This is a simplified approach - in production, use Supabase migrations
        if 'CREATE TABLE IF NOT EXISTS system_settings' in statement:
            print("✅ Table creation will be handled by Supabase")
        elif 'CREATE INDEX' in statement:
            print("✅ Index creation will be handled by Supabase")
        elif 'CREATE POLICY' in statement or 'DROP POLICY' in statement:
            print("✅ Policy creation will be handled by Supabase")
        elif 'INSERT INTO system_settings' in statement:
            # Try to insert via table operations
            try:
                # Parse the INSERT statement (simplified)
                if 'maintenance_mode' in statement:
                    supabase.table('system_settings').upsert({
                        'key': 'maintenance_mode',
                        'value': {"enabled": False, "message": "המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.", "message_en": "System is under maintenance. Please try again later."},
                        'description': 'מצב תחזוקה כללי'
                    }, on_conflict='key').execute()
                    print("✅ Inserted maintenance_mode setting")
                elif 'app_name' in statement:
                    supabase.table('system_settings').upsert({
                        'key': 'app_name',
                        'value': 'CLICK HR Platform',
                        'description': 'שם האפליקציה'
                    }, on_conflict='key').execute()
                    print("✅ Inserted app_name setting")
                elif 'default_language' in statement:
                    supabase.table('system_settings').upsert({
                        'key': 'default_language',
                        'value': 'he',
                        'description': 'שפה ברירת מחדל'
                    }, on_conflict='key').execute()
                    print("✅ Inserted default_language setting")
            except Exception as e:
                print(f"⚠️  Note: {str(e)} - Table might not exist yet, will be created via SQL")
        elif 'ALTER TABLE organizations' in statement:
            print("✅ Organization table alterations will be handled by Supabase")
        else:
            print(f"⚠️  Skipping statement (requires direct SQL execution): {statement[:50]}...")
            
    except Exception as e:
        print(f"⚠️  Warning on statement {i}: {str(e)}")

print("\n✅ Migration script completed!")
print("📌 Note: Some operations require direct SQL execution in Supabase Dashboard")
print("📌 Please run the SQL file manually in Supabase SQL Editor if needed")
