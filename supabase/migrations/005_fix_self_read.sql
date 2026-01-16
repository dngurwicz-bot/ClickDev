-- Drop potentially conflicting or malformed policies
DROP POLICY IF EXISTS "users_can_read_own_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON user_roles;

-- Re-create the self-read policy explicitly
CREATE POLICY "users_can_read_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Verify grants just in case (though we saw them)
GRANT SELECT ON user_roles TO authenticated;
