
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Add parent directory to path to import local modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

supabase: Client = create_client(url, key)

def ensure_employee():
    # Get organization
    org_res = supabase.table("organizations").select("id").limit(1).execute()
    if not org_res.data:
        print("No organization found. Cannot create employee.")
        return

    org_id = org_res.data[0]['id']

    # check if employee exists
    res = supabase.table("employees").select("*").limit(1).execute()
    if res.data:
        print(f"Employee found: {res.data[0]['first_name']} {res.data[0]['last_name']}")
        return res.data[0]['id']

    # Create dummy employee
    employee = {
        "organization_id": org_id,
        "first_name": "Israel",
        "last_name": "Israeli",
        "id_number": "000000000",
        "email": "israel@example.com",
        "job_title": "Head of Engineering",
        "hire_date": "2024-01-01",
        "status": "active"
    }

    print("Creating dummy employee...")
    res = supabase.table("employees").insert(employee).execute()
    
    if res.data:
        print(f"Created employee: {res.data[0]['first_name']} {res.data[0]['last_name']}")
        return res.data[0]['id']
    else:
        print("Failed to create employee")

if __name__ == "__main__":
    ensure_employee()
