"""
Script to apply database migrations to Supabase.
"""

import os
import glob
import sys
from dotenv import load_dotenv

# Load env from .env file explicitly
# Check for .env in current dir or parent dir
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '../.env')
if not os.path.exists(env_path):
    env_path = os.path.join(current_dir, '.env')

load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

def apply_migrations():
    """Apply migrations using direct PostgreSQL connection if available."""
    
    # Resolve path relative to this script file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    migrations_dir = os.path.join(base_dir, "../../supabase/migrations")
    
    print(f"DEBUG: BASE_DIR={base_dir}")
    print(f"DEBUG: MIGRATIONS_DIR={os.path.abspath(migrations_dir)}")
    
    files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
    print(f"Found {len(files)} migrations.")
    
    if not DATABASE_URL:
        print("WARNING: DATABASE_URL not set in environment.")
        print("Cannot apply DDL migrations via Supabase client directly.")
        print("Please set DATABASE_URL=postgres://user:pass@host:port/db in .env")
        sys.exit(1)

    try:
        import psycopg2
        
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Ensure migrations table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        conn.commit()
        
        # Get applied migrations
        cur.execute("SELECT name FROM migrations")
        applied_migrations = {row[0] for row in cur.fetchall()}
        
        for f in files:
            filename = os.path.basename(f)
            if filename in applied_migrations:
                # print(f"Skipping {filename} (already applied)")
                continue
                
            print(f"Applying {filename}...")
            with open(f, 'r', encoding='utf-8') as sql_file:
                sql = sql_file.read()
                
            try:
                cur.execute(sql)
                cur.execute("INSERT INTO migrations (name) VALUES (%s)", (filename,))
                conn.commit()
                print(f"Successfully applied {filename}")
            except Exception as e:
                conn.rollback()
                print(f"Failed to apply {filename}: {e}")
                sys.exit(1)
                
        cur.close()
        conn.close()
        print("Migration script finished successfully.")
        
    except ImportError:
        print("Error: psycopg2 module not found. Please run: pip install psycopg2-binary")
        sys.exit(1)
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_migrations()
