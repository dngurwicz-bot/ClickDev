"""Find user by email"""
from database import supabase_admin

email = "dngurwicz@gmail.com"

print(f"\nSearching for user: {email}")
print("=" * 60)

# Try to get user from auth.users via admin API
try:
    # Note: The Python Supabase client may not have direct admin.list_users()
    # Let's try a different approach - check if user is in any tables
    
    # Check user_roles table
    roles = supabase_admin.table("user_roles").select("*").execute()
    print(f"\nAll user_roles entries: {len(roles.data)}")
    for role in roles.data:
        print(f"  User ID: {role['user_id']}, Role: {role['role']}")
    
    # Since we can't easily list auth users with anon key,
    # let's create the role entry with a placeholder and ask user to provide ID
    print(f"\n{'='*60}")
    print("NEXT STEP:")
    print("1. Log in to the frontend with dngurwicz@gmail.com")
    print("2. Open browser console (F12)")
    print("3. Run this command:")
    print("   (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session.user.id")
    print("4. Copy the user ID and we'll add it to user_roles")
    print("=" * 60)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
