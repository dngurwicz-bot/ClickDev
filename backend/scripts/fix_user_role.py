
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_API_KEY:
    print("Error: Supabase credentials missing")
    exit(1)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
    print("Connected to Supabase")
    
    email = "dngurwicz@gmail.com"
    
    # Find user ID
    users = supabase.auth.admin.list_users()
    user_id = None
    for u in users:
        if u.email == email:
            user_id = u.id
            print(f"Found user {email} with ID: {user_id}")
            break
            
    if not user_id:
        print(f"User {email} not found.")
        exit(1)

    # Assign/Update Role
    print(f"Assigning super_admin role to {user_id}...")
    
    res = supabase.table("user_roles").select("*").eq("user_id", user_id).execute()
    if res.data:
        print("Role entry exists, updating to super_admin...")
        supabase.table("user_roles").update({"role": "super_admin"}).eq("user_id", user_id).execute()
    else:
        print("Inserting super_admin role entry...")
        supabase.table("user_roles").insert({
            "user_id": user_id,
            "role": "super_admin"
        }).execute()
        
    print("Success! User has been granted super_admin privileges.")

except Exception as e:
    print(f"An error occurred: {e}")
    exit(1)
