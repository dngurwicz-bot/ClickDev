"""
Add super_admin role for dngurwicz@gmail.com
Run this after logging in to get your user ID
"""
from database import supabase_admin
import sys

print("\n" + "=" * 60)
print("ADD SUPER ADMIN ROLE")
print("=" * 60)

# Ask for user ID
print("\nTo get your User ID:")
print("1. Open http://localhost:3000 in your browser")
print("2. Log in with: dngurwicz@gmail.com")
print("3. Open browser console (F12)")
print("4. Paste this command:")
print("\n   (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session.user.id")
print("\n5. Copy the UUID that appears\n")

user_id = input("Paste your User ID here: ").strip()

if not user_id:
    print("❌ No user ID provided")
    sys.exit(1)

print(f"\nAdding super_admin role for user: {user_id}")

try:
    # Check if role already exists
    existing = supabase_admin.table("user_roles").select("*").eq("user_id", user_id).execute()
    
    if existing.data:
        print(f"✓ Found existing role: {existing.data[0]['role']}")
        print("Updating to super_admin...")
        result = supabase_admin.table("user_roles").update({
            "role": "super_admin"
        }).eq("user_id", user_id).execute()
    else:
        print("Creating new super_admin role...")
        result = supabase_admin.table("user_roles").insert({
            "user_id": user_id,
            "role": "super_admin"
        }).execute()
    
    if result.data:
        print("\n" + "=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
        print(f"User ID: {user_id}")
        print(f"Email: dngurwicz@gmail.com")
        print(f"Role: super_admin")
        print("\nYou can now access the admin dashboard!")
        print("Refresh the page: http://localhost:3000/admin/dashboard")
        print("=" * 60)
    else:
        print("\n❌ Failed to assign role")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
