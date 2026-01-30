"""
Simple script to assign super_admin to any user
"""
from database import supabase_admin
import sys

def list_and_assign():
    """List auth users and assign super_admin"""
    print("=" * 60)
    print("SUPER ADMIN ASSIGNMENT")
    print("=" * 60)
    
    # Try to get user email from command line
    if len(sys.argv) > 1:
        user_email = sys.argv[1]
        print(f"\nLooking for user: {user_email}")
        
        # Query auth.users via RPC or direct table access
        # Note: We need to use the service role key to access auth.users
        try:
            # Try to find user in user_roles first
            roles = supabase_admin.table("user_roles").select("*").execute()
            print(f"\nCurrent user_roles: {len(roles.data)} entries")
            
            # For now, let's just accept a UUID directly
            print("\nPlease provide the User ID (UUID) from Supabase Dashboard > Authentication > Users")
            print("Or check the browser console after logging in")
            
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("\nUsage: python quick_assign.py <user_id>")
        print("\nTo find your user ID:")
        print("1. Go to Supabase Dashboard > Authentication > Users")
        print("2. Copy the UUID of your user")
        print("3. Run: python quick_assign.py <your-uuid>")
        print("\nOR check browser console after logging in to the frontend")

if __name__ == "__main__":
    list_and_assign()
