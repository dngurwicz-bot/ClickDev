
import jwt
import os

key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvanVuYWViYnR5bWxsc2FxbG1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ3ODk0MiwiZXhwIjoyMDg0MDU0OTQyfQ.jtFg_HE8jGS4Nt9MkMED38JPx4Ou-n1EVTMbd--AIVU")
print(f"Key: {key}")
try:
    decoded = jwt.decode(key, options={"verify_signature": False})
    print(decoded)
except Exception as e:
    print(e)
