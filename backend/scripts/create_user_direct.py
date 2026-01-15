#!/usr/bin/env python3
"""
Create Super Admin User via Supabase Admin API (Direct HTTP)
"""
import os
import sys
import requests
import json
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

def create_super_admin(email: str, password: str, full_name: str = "Super Admin"):
    """Create a super admin user using Supabase Admin API"""
    try:
        print(f"🔐 Creating user: {email}...")
        
        # Create user via Admin API
        # Use the service role key directly
        auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        payload = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name
            }
        }
        
        response = requests.post(auth_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        user_data = response.json()
        user_id = user_data.get("id")
        
        if not user_id:
            print("❌ Failed to create user - no user ID returned")
            print(f"Response: {user_data}")
            return False
        
        print(f"✅ User created with ID: {user_id}")
        
        # Create profile
        print("👤 Creating profile...")
        profile_url = f"{SUPABASE_URL}/rest/v1/profiles"
        profile_headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        profile_payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "is_super_admin": True
        }
        
        profile_response = requests.post(profile_url, headers=profile_headers, json=profile_payload)
        
        if profile_response.status_code not in [200, 201]:
            print(f"⚠️  Warning: Profile creation failed: {profile_response.status_code}")
            print(f"Response: {profile_response.text}")
        
        # Create user_role
        print("🔑 Creating super admin role...")
        role_url = f"{SUPABASE_URL}/rest/v1/user_roles"
        role_headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        role_payload = {
            "user_id": user_id,
            "organization_id": None,
            "role": "super_admin"
        }
        
        role_response = requests.post(role_url, headers=role_headers, json=role_payload)
        
        if role_response.status_code in [200, 201]:
            print(f"✅ Super Admin role created successfully!")
            print(f"\n📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🆔 User ID: {user_id}")
            print(f"\n✨ You can now login at: http://localhost:3000/login")
            return True
        else:
            print(f"❌ Failed to create user role: {role_response.status_code}")
            print(f"Response: {role_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_user_direct.py <email> <password> [full_name]")
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
