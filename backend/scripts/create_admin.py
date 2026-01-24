
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
    password = "Spni2025!"
    
    # Check if user exists
    # Note: `list_users` is not always straightforward with all libs, but `create_user` usually fails if exists
    # or creates a new one. `admin.list_users` exists.
    
    print(f"Creating user {email}...")
    
    # Try to invite/create user. 
    # Use create_user to set password immediately + auto confirm.
    try:
        user_attributes = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": "Super",
                "last_name": "Admin"
            }
        }
        user = supabase.auth.admin.create_user(user_attributes)
        user_id = user.user.id
        print(f"User created with ID: {user_id}")
        
    except Exception as e:
        print(f"Creation might have failed (or user exists): {e}")
        # Try to fetch user by email if possible?
        # Supabase Admin API doesn't have get_user_by_email directly in all versions, but let's assume we can proceed
        # or we might need to list users and filter.
        # However, for now, let's assume if it exists we just need to get the ID.
        # But 'create_user' throws if exists usually? Or returns object?
        # Retrying to fetch from DB users table (via RPC if needed, but we don't have it).
        # Let's try to list users to find the ID.
        users = supabase.auth.admin.list_users()
        found = False
        for u in users:
             if u.email == email:
                 user_id = u.id
                 found = True
                 print(f"User already exists with ID: {user_id}")
                 break
        if not found:
             print("Could not create or find user.")
             exit(1)

    # Assign Role
    print("Assigning super_admin role...")
    
    # Check if role exists
    res = supabase.table("user_roles").select("*").eq("user_id", user_id).execute()
    if res.data:
        # Update or leave it
        print("Role entry exists, updating...")
        supabase.table("user_roles").update({"role": "super_admin"}).eq("user_id", user_id).execute()
    else:
        # Insert
        print("Inserting role entry...")
        supabase.table("user_roles").insert({
            "user_id": user_id,
            "role": "super_admin"
        }).execute()
        
    print("Success! Super Admin created.")

except Exception as e:
    print(f"An error occurred: {e}")
    exit(1)
