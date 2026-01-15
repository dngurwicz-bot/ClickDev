#!/usr/bin/env python3
"""
Create Super Admin User
Run: python scripts/create_super_admin.py
"""
import os
import sys
from supabase import create_client, Client
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
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

# Create Supabase client with service role (admin access)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def create_super_admin(email: str, password: str, full_name: str = "Super Admin"):
    """Create a super admin user"""
    try:
        # Create user in auth.users using admin API
        print(f"🔐 Creating user: {email}...")
        
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirm email
            "user_metadata": {
                "full_name": full_name
            }
        })
        
        if not response.user:
            print("❌ Failed to create user")
            return False
        
        user_id = response.user.id
        print(f"✅ User created with ID: {user_id}")
        
        # Create profile with super admin flag
        print("👤 Creating profile with super admin privileges...")
        
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "is_super_admin": True
        }
        
        result = supabase.table("profiles").insert(profile_data).execute()
        
        if result.data:
            print(f"✅ Super Admin profile created successfully!")
            print(f"\n📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🆔 User ID: {user_id}")
            print(f"\n✨ You can now login at: http://localhost:3000/login")
            return True
        else:
            print("❌ Failed to create profile")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Default credentials (you can change these)
    email = "admin@click.dev"
    password = "Admin123!@#"
    full_name = "Super Admin"
    
    # Check if email/password provided as arguments
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
        if len(sys.argv) >= 4:
            full_name = sys.argv[3]
    
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
