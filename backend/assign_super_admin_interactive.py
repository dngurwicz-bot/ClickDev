"""
Assign super_admin role - Interactive version
"""
from .database import supabase_admin

print("=" * 70)
print("ASSIGN SUPER ADMIN ROLE")
print("=" * 70)
print()
print("INSTRUCTIONS:")
print("1. Open your browser and go to: http://localhost:3000/admin/dashboard")
print("2. Open the browser console (F12 > Console tab)")
print("3. Look for the message showing 'YOUR USER ID'")
print("4. Copy the UUID shown")
print("5. Paste it below")
print()
print("=" * 70)
print()

user_id = input("Enter your User ID (UUID): ").strip()

if not user_id:
    print("❌ No user ID provided")
    exit(1)

print(f"\nAssigning super_admin role to user: {user_id}")

try:
    # Check if role already exists
    existing = supabase_admin.table("user_roles").select(
        "*"
    ).eq("user_id", user_id).execute()

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
        print("\n" + "=" * 70)
        print("✅ SUCCESS! User is now a super_admin")
        print("=" * 70)
        print(f"User ID: {user_id}")
        print("Role: super_admin")
        print()
        print("🔄 Please REFRESH your browser to access the admin dashboard")
        print("=" * 70)
    else:
        print("\n❌ Failed to assign role")
        print(f"Response: {result}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
