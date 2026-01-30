"""
Quick script to check and assign super_admin role automatically
"""
from database import supabase_admin  # pylint: disable=import-error

print("=" * 70)
print("CHECKING EXISTING USERS AND ROLES")
print("=" * 70)
print()

try:
    # Get all auth users (limited to avoid spam)
    print("Fetching users from auth.users...")

    # Use the RPC function we have
    users_response = supabase_admin.rpc('get_all_users').execute()

    if not users_response.data:
        print("❌ No users found in the system")
        exit(1)

    print(f"\n✓ Found {len(users_response.data)} user(s)")
    print()

    # Display users
    for idx, user in enumerate(users_response.data, 1):
        user_id = user.get('id')
        email = user.get('email', 'No email')
        role = user.get('role', 'No role')

        print(f"{idx}. User: {email}")
        print(f"   ID: {user_id}")
        print(f"   Current Role: {role}")
        print()

    # Check if any user already has super_admin
    super_admins = [
        u for u in users_response.data if u.get('role') == 'Super Admin'
    ]

    if super_admins:
        print("=" * 70)
        print("✅ SUPER ADMIN(S) ALREADY EXIST:")
        for admin in super_admins:
            print(f"   - {admin.get('email')} ({admin.get('id')})")
        print("=" * 70)
    else:
        print("=" * 70)
        print("⚠️  NO SUPER ADMIN FOUND")
        print("=" * 70)
        print()

        # Assign super_admin to the first user (most likely the creator)
        if users_response.data:
            first_user = users_response.data[0]
            user_id = first_user.get('id')
            email = first_user.get('email')

            print(f"Assigning super_admin role to: {email}")
            print(f"User ID: {user_id}")
            print()

            # Check if role exists
            existing = supabase_admin.table("user_roles")\
                .select("*").eq("user_id", user_id).execute()

            if existing.data:
                print("Updating existing role...")
                result = supabase_admin.table("user_roles").update({
                    "role": "super_admin",
                    "organization_id": None
                }).eq("user_id", user_id).execute()
            else:
                print("Creating new super_admin role...")
                result = supabase_admin.table("user_roles").insert({
                    "user_id": user_id,
                    "role": "super_admin",
                    "organization_id": None
                }).execute()

            if result.data:
                print()
                print("=" * 70)
                print("✅ SUCCESS! User is now a super_admin")
                print("=" * 70)
                print(f"Email: {email}")
                print(f"User ID: {user_id}")
                print("Role: super_admin")
                print()
                print("🔄 REFRESH browser to access admin dashboard")
                print("=" * 70)
            else:
                print("\n❌ Failed to assign role")
                print(f"Response: {result}")

except Exception as e:  # pylint: disable=broad-except
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
