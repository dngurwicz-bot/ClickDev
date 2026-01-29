-- 025_drop_employee_events.sql - Clean slate for employee file system
-- Drops all employee-related tables and starts fresh

-- Drop triggers first
DROP TRIGGER IF EXISTS employee_address_updated_at_trigger ON employee_address;
DROP FUNCTION IF EXISTS update_employee_address_updated_at();

-- Drop RLS policies for employee_address
DROP POLICY IF EXISTS "super_admin_all_employee_address" ON employee_address;
DROP POLICY IF EXISTS "org_admin_own_employee_address" ON employee_address;
DROP POLICY IF EXISTS "employee_own_address" ON employee_address;

-- Drop RLS policies for employee_history
DROP POLICY IF EXISTS "super_admin_all_history" ON employee_history;
DROP POLICY IF EXISTS "org_admin_own_history" ON employee_history;

-- Drop RLS policies for employees
DROP POLICY IF EXISTS "super_admin_all_employees" ON employees;
DROP POLICY IF EXISTS "org_admin_own_employees" ON employees;
DROP POLICY IF EXISTS "employee_own_record" ON employees;

-- Drop RLS policies for employee_user_mapping
DROP POLICY IF EXISTS "users_own_mapping" ON employee_user_mapping;

-- Drop indexes (will be dropped automatically with tables, but being explicit)
DROP INDEX IF EXISTS idx_employee_address_employee;
DROP INDEX IF EXISTS idx_employee_address_org;
DROP INDEX IF EXISTS idx_employee_address_valid_from;
DROP INDEX IF EXISTS idx_employee_address_city_code;
DROP INDEX IF EXISTS idx_employee_address_active;
DROP INDEX IF EXISTS idx_employees_org;
DROP INDEX IF EXISTS idx_employees_manager;
DROP INDEX IF EXISTS idx_employees_status;
DROP INDEX IF EXISTS idx_history_employee;
DROP INDEX IF EXISTS idx_history_valid_from;
DROP INDEX IF EXISTS idx_history_field;

-- Drop tables in correct order (dependent tables first)
DROP TABLE IF EXISTS employee_address CASCADE;
DROP TABLE IF EXISTS employee_history CASCADE;
DROP TABLE IF EXISTS employee_user_mapping CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Clean up: Remove any orphaned data from positions table that referenced employees
-- (positions have employee_id foreign key)
UPDATE positions SET employee_id = NULL WHERE employee_id IS NOT NULL;
