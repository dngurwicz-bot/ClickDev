import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables
load_dotenv(r"c:\Click\backend\.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_API_KEY:
    print("Error: Supabase credentials missing")
    exit(1)

def fix_storage_bucket():
    print("Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
        
        print("Checking/Creating 'avatars' bucket...")
        # Try to get bucket first
        try:
            buckets = supabase.storage.list_buckets()
            avatar_bucket = next((b for b in buckets if b.name == 'avatars'), None)
            
            if avatar_bucket:
                print("Bucket 'avatars' already exists.")
            else:
                print("Bucket 'avatars' not found. Creating...")
                supabase.storage.create_bucket('avatars', options={'public': True})
                print("Bucket 'avatars' created successfully.")
                
        except Exception as e:
            # If list_buckets fails or create fails
            print(f"Error checking/creating bucket: {e}")
            # Attempt create blindly if list failed?
            try:
                supabase.storage.create_bucket('avatars', options={'public': True})
                print("Bucket 'avatars' created (blind attempt).")
            except Exception as e2:
                print(f"Blind create failed: {e2}")

        print("Bucket setup complete.")

    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    fix_storage_bucket()
