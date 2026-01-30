"""
Assign super_admin role to an existing user
This script assigns the super_admin role to a user that already exists in Supabase Auth.
"""
from database import supabase_admin

def assign_super_admin():
    """Assign super_admin role to existing user"""
    print("=" * 60)
    print("ASSIGN SUPER ADMIN ROLE")
    print("=" * 60)
    
    # First, let's see what users exist in the user_roles table
    print("\nChecking existing user_roles...")
    roles_response = supabase_admin.table("user_roles").select("*").execute()
    print(f"Found {len(roles_response.data)} existing role(s)")
    
    # Get user ID from user input or use a default
    print("\nTo assign super_admin role, we need a user ID.")
    print("You can get this from:")
    print("1. Supabase Dashboard > Authentication > Users")
    print("2. Or by logging in to the frontend and checking the browser console")
    print()
    
    user_id = input("Enter the User ID (UUID): ").strip()
    
    if not user_id:
        print("❌ No user ID provided")
        return
    
    # Check if role already exists for this user
    existing = supabase_admin.table("user_roles").select("*").eq("user_id", user_id).execute()
    
    if existing.data:
        print(f"\n✓ User already has a role: {existing.data[0]['role']}")
        print("Updating to super_admin...")
        result = supabase_admin.table("user_roles").update({
            "role": "super_admin"
        }).eq("user_id", user_id).execute()
    else:
        print("\nCreating new super_admin role...")
        result = supabase_admin.table("user_roles").insert({
            "user_id": user_id,
            "role": "super_admin"
        }).execute()
    
    if result.data:
        print("\n✅ SUCCESS! User is now a super_admin")
        print(f"User ID: {user_id}")
        print(f"Role: super_admin")
    else:
        print("\n❌ Failed to assign role")
        print(f"Error: {result}")

if __name__ == "__main__":
    try:
        assign_super_admin()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
