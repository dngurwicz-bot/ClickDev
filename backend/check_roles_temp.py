"""Check user roles"""
from database import supabase_admin

try:
    roles = supabase_admin.table('user_roles').select('*').execute()
    print(f'\nFound {len(roles.data)} user role(s):\n')
    
    super_admins = []
    for r in roles.data:
        print(f"User ID: {r['user_id']}")
        print(f"  Role: {r['role']}")
        print(f"  Org ID: {r.get('organization_id', 'N/A')}")
        if r['role'] == 'super_admin':
            super_admins.append(r)
            print("  ✓ SUPER ADMIN")
        print()
    
    print(f"Total super admins: {len(super_admins)}")
    
    if len(super_admins) == 0:
        print("\n❌ WARNING: No super admin users found!")
        print("Run: python scripts/create_admin.py")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
