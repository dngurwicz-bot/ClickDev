
import os
import sys

# Add parent dir to path to import database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import supabase_admin as supabase

def setup_tables():
    print("Setting up Hilan Event tables...")
    
    # SQL to create tables
    # Note: We are using a postgres function via rpc usually, but supabase-py 'rpc' might not work if the function doesn't exist.
    # Since we don't have direct SQL access via client easily without creating a function first, 
    # we will attempt to use the 'rest' api to creating them via a special SQL endpoint if available, 
    # or fail and assume we need to execute this SQL in the Supabase Dashboard.
    
    # HOWEVER, for this environment, often 'extensions' or direct query tool is better. 
    # Since I cannot assume direct SQL access, I will PRINT the SQL instructions for the user 
    # OR try to infer if I can use an existing table creation mechanism.
    
    # As a fallback, I will simulate the existence of these tables by creating them if I can, 
    # but practically I will log what needs to be done.
    
    sql_commands = """
    -- Table for Event 203 (Rank/Role)
    CREATE TABLE IF NOT EXISTS public.employee_ranks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID REFERENCES public.employees(id) NOT NULL,
        rank_code VARCHAR(10),
        rank_name VARCHAR(100),
        job_title VARCHAR(100),
        department VARCHAR(100),
        valid_from DATE NOT NULL,
        valid_to DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        changed_by UUID
    );

    -- Table for Event 201 (Status)
    CREATE TABLE IF NOT EXISTS public.employee_status (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID REFERENCES public.employees(id) NOT NULL,
        status_code VARCHAR(10) NOT NULL, -- e.g. 1 Active, 3 Maternity
        status_name VARCHAR(50),
        reason VARCHAR(255),
        valid_from DATE NOT NULL,
        valid_to DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        changed_by UUID
    );

    -- Table for Event 205 (Tax)
    CREATE TABLE IF NOT EXISTS public.employee_tax (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID REFERENCES public.employees(id) NOT NULL,
        tax_points DECIMAL(4,2),
        is_resident BOOLEAN DEFAULT TRUE,
        valid_from DATE NOT NULL,
        valid_to DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    
    print("\n--- ACTION REQUIRED ---")
    print("Since direct DDL execution via the Supabase Client (REST) is restricted,")
    print("Please execute the following SQL in your Supabase SQL Editor:")
    print(sql_commands)
    print("-----------------------\n")

if __name__ == "__main__":
    setup_tables()
