-- Function to check if current user is Super Admin (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Function to get organization IDs the current user belongs to (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS TABLE (org_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM user_roles
  WHERE user_id = auth.uid()
  AND organization_id IS NOT NULL;
$$;

-- Policy: Super Admins can see ALL user roles
CREATE POLICY "super_admins_view_all"
ON user_roles
FOR SELECT
TO authenticated
USING (
  check_is_super_admin()
);

-- Policy: Organization Members can see all roles within their organizations
CREATE POLICY "org_members_view_colleagues"
ON user_roles
FOR SELECT
TO authenticated
USING (
  organization_id IN (SELECT org_id FROM get_my_org_ids())
);
