-- 017_org_settings_rls.sql
-- Allow Organization Admins to update their own organization settings (hierarchy, lock)

CREATE POLICY "org_admin_update_own_org" ON organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'organization_admin'
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'organization_admin'
  )
);
