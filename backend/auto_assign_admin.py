"""
Auto-assign super_admin role to the first user in Supabase Auth
This script automatically finds users and assigns super_admin role.
"""
from database import supabase_admin

def auto_assign_admin():
    """Automatically assign super_admin role to first user"""
    print("=" * 60)
    print("AUTO-ASSIGN SUPER ADMIN ROLE")
    print("=" * 60)
    
    # Check existing roles
    print("\nChecking existing user_roles...")
    roles_response = supabase_admin.table("user_roles").select("*").execute()
    print(f"Found {len(roles_response.data)} existing role(s)")
    
    # Check if we already have a super admin
    super_admins = [r for r in roles_response.data if r.get('role') == 'super_admin']
    if super_admins:
        print(f"\n✓ Super admin already exists!")
        print(f"User ID: {super_admins[0]['user_id']}")
        return
    
    # Get all users from auth.users using admin client
    print("\nFetching users from Supabase Auth...")
    try:
        # Use the admin API to list users
        from supabase.lib.client_options import ClientOptions
        import os
        
        # Get users via admin API
        auth_response = supabase_admin.auth.admin.list_users()
        
        if not auth_response:
            print("❌ No users found in Supabase Auth")
            print("Please create a user first by signing up in the frontend")
            return
        
        users = auth_response
        print(f"Found {len(users)} user(s) in Auth")
        
        # Display users
        for i, user in enumerate(users, 1):
            email = user.email if hasattr(user, 'email') else user.get('email', 'N/A')
            user_id = user.id if hasattr(user, 'id') else user.get('id')
            print(f"{i}. {email} (ID: {user_id})")
        
        # Use the first user
        first_user = users[0]
        user_id = first_user.id if hasattr(first_user, 'id') else first_user.get('id')
        user_email = first_user.email if hasattr(first_user, 'email') else first_user.get('email', 'N/A')
        
        print(f"\nAssigning super_admin role to: {user_email}")
        
        # Check if role already exists for this user
        existing = supabase_admin.table("user_roles").select("*").eq("user_id", user_id).execute()
        
        if existing.data:
            print(f"✓ User already has a role: {existing.data[0]['role']}")
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
            print("\n✅ SUCCESS! User is now a super_admin")
            print(f"Email: {user_email}")
            print(f"User ID: {user_id}")
            print(f"Role: super_admin")
            print("\n🔄 Please refresh your browser to access the admin dashboard")
        else:
            print("\n❌ Failed to assign role")
            print(f"Error: {result}")
            
    except Exception as e:
        print(f"\n❌ Error accessing auth users: {e}")
        print("\nFalling back to manual assignment...")
        print("Please run: python assign_admin.py")

if __name__ == "__main__":
    try:
        auto_assign_admin()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
