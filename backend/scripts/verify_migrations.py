"""
Script to verify if the 017 database migration was applied.
"""
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

URL: str = os.environ.get("SUPABASE_URL")
# Use Service Role Key to bypass RLS for verification if available
KEY: str = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
    os.environ.get("SUPABASE_API_KEY")
)

if not URL or not KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
    exit(1)

supabase: Client = create_client(URL, KEY)


async def check_migrations():
    """
    Check if the org settings migration has been applied.
    """
    try:
        # Check migrations table
        print("Checking migrations table...")
        response = supabase.table('migrations').select('*').execute()
        migrations = sorted([m['name'] for m in response.data])

        print(f"Found {len(migrations)} applied migrations:")
        for migration in migrations:
            print(f" - {migration}")

        if '017_org_settings_rls.sql' in migrations:
            print("\nSUCCESS: 017_org_settings_rls.sql is marked as applied.")
        else:
            print("\nWARNING: 017_org_settings_rls.sql is NOT in migrations.")

    except Exception as error:  # pylint: disable=broad-except
        print(f"Error: {error}")


if __name__ == "__main__":
    asyncio.run(check_migrations())
