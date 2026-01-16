-- Create a temporary debug policy to allow ALL selects for authenticated users
-- This helps us determine if the issue is with the row-filter logic or table access
CREATE POLICY "debug_read_all"
ON user_roles
FOR SELECT
TO authenticated
USING (true);
