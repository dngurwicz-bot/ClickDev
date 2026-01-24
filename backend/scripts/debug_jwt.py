
import jwt
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Click\backend\.env")

key = os.getenv("SUPABASE_API_KEY")
if not key:
    raise ValueError("SUPABASE_API_KEY environment variable is not set")
print(f"Key: {key}")
try:
    decoded = jwt.decode(key, options={"verify_signature": False})
    print(decoded)
except Exception as e:
    print(e)
