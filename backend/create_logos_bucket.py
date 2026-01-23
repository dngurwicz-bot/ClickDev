import os
from supabase import create_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_API_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

try:
    # Create logos bucket
    print("Creating logos bucket...")
    result = supabase.storage.create_bucket("logos", options={"public": True})
    print(f"Bucket created successfully: {result}")
except Exception as e:
    if "already exists" in str(e).lower():
        print("Logos bucket already exists")
    else:
        print(f"Error creating bucket: {e}")

print("Done!")
