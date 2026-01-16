-- Remove the temporary debug policy
DROP POLICY IF EXISTS "read_all_debug" ON user_roles;

-- The following policies from 007_clean_rls.sql remain active:
-- 1. "service_role_bypass" (USING true)
-- 2. "read_own_roles" (USING user_id = auth.uid())

-- This restores the system to a secure state where users can only see their own roles
-- (and Service Role can see everything).
