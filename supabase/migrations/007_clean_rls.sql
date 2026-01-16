-- Clean sweep of user_roles policies
DROP POLICY IF EXISTS "service_role_all_access_users" ON user_roles;
DROP POLICY IF EXISTS "users_can_read_own_roles" ON user_roles;
DROP POLICY IF EXISTS "users_can_insert_own_roles" ON user_roles;
DROP POLICY IF EXISTS "Organization creators can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization creators can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization creators can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization creators can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "debug_read_all" ON user_roles;

-- 1. Service Role Bypass (CRITICAL)
CREATE POLICY "service_role_bypass"
ON user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Self Access (Authorized users can read their own roles)
CREATE POLICY "read_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Debug All (Allow Authenticated to read ALL - Temporary)
CREATE POLICY "read_all_debug"
ON user_roles
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is on
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
