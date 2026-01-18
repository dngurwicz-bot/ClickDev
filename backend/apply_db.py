import os
import glob
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from .env file explicitly
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_API_KEY:
    print("Error: Supabase credentials missing")
    exit(1)

# Connect
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
    print("Connected to Supabase")
except Exception as e:
    print(f"Error connecting: {e}")
    exit(1)

# Migration Path
MIGRATIONS_DIR = "../supabase/migrations"
files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))

print(f"Found {len(files)} migrations.")

for f in files:
    filename = os.path.basename(f)
    print(f"Applying {filename}...")
    with open(f, 'r') as sql_file:
        sql = sql_file.read()
        
    try:
        # Use postgres rpc to execute sql? 
        # Standard supabase-py client DOES NOT have a method to execute arbitrary SQL directly via Rest API unless there is a function for it.
        # However, we can TRY to use the 'rpc' interface if there is a 'exec_sql' function, which typically isn't there by default.
        # BUT, the prompt said "supabase-mcp-server" has "execute_sql".
        # I am NOT running this via MCP here, I am running a python script.
        # The Python Client CANNOT execute SQL directly unless connected via Postgres driver (psycopg2) or if there is an RPC.
        # This script approach might FAIL if I use strict supabase-py.
        
        # ALTERNATIVE: Use `requests` to call the SQL API found in Supabase Management API? 
        # No, Management API requires different token.
        
        # ACTUALLY: The user provided SERVICE ROLE KEY.
        # If I cannot run SQL via this script, I should ASK THE USER to run it OR I should use the MCP tool iteratively.
        # The MCP tool `mcp_supabase-mcp-server_execute_sql` exists! 
        # I should USE THE MCP TOOL instead of this script.
        pass
    except Exception as e:
        print(f"Failed to apply {filename}: {e}")
        # Continue or break?
        
print("Migration script finish (placeholder logic)")
