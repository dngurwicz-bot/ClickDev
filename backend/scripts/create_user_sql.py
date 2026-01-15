#!/usr/bin/env python3
"""
Create Super Admin User via SQL
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import hashlib
import secrets

# Load environment variables
env_path = Path(".env.local")
if not env_path.exists():
    env_path = Path(".env")
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def create_super_admin(email: str, password: str, full_name: str = "Super Admin"):
    """Create a super admin user using admin API"""
    try:
        print(f"🔐 Creating user: {email}...")
        
        # Use admin API to create user
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name
            }
        })
        
        if not response or not hasattr(response, 'user') or not response.user:
            print("❌ Failed to create user - no user returned")
            return False
        
        user_id = response.user.id
        print(f"✅ User created with ID: {user_id}")
        
        # Create profile
        print("👤 Creating profile...")
        profile_result = supabase.table("profiles").insert({
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "is_super_admin": True
        }).execute()
        
        if not profile_result.data:
            print("⚠️  Warning: Profile creation failed, but continuing...")
        
        # Create user_role
        print("🔑 Creating super admin role...")
        role_result = supabase.table("user_roles").insert({
            "user_id": user_id,
            "organization_id": None,
            "role": "super_admin"
        }).execute()
        
        if role_result.data:
            print(f"✅ Super Admin role created successfully!")
            print(f"\n📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🆔 User ID: {user_id}")
            print(f"\n✨ You can now login at: http://localhost:3000/login")
            return True
        else:
            print("❌ Failed to create user role")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_user_sql.py <email> <password> [full_name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Super Admin"
    
    print("🚀 Creating Super Admin User...")
    print("=" * 50)
    
    success = create_super_admin(email, password, full_name)
    
    if success:
        print("\n" + "=" * 50)
        print("✅ Super Admin created successfully!")
    else:
        print("\n" + "=" * 50)
        print("❌ Failed to create Super Admin")
        sys.exit(1)
