"""
Script to check environment variables.
"""
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '../.env')
print(f"Loading env from: {os.path.abspath(env_path)}")
load_dotenv(env_path)

print("Keys in environment:")
for key in os.environ:
    if "SUPABASE" in key:
        print(key)

