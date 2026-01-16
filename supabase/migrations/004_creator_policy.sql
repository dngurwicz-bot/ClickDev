-- Policy to allow organization creators to view/manage user roles in their organization
-- This solves the issue where a creator cannot see the user list despite being the owner
-- We check if the current user is the 'created_by' of the organization linked to the user_role

CREATE POLICY "Organization creators can view user roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  exists (
    select 1
    from organizations
    where organizations.id = user_roles.organization_id
    and organizations.created_by = auth.uid()
  )
);

CREATE POLICY "Organization creators can insert user roles"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  exists (
    select 1
    from organizations
    where organizations.id = user_roles.organization_id
    and organizations.created_by = auth.uid()
  )
);

CREATE POLICY "Organization creators can update user roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (
  exists (
    select 1
    from organizations
    where organizations.id = user_roles.organization_id
    and organizations.created_by = auth.uid()
  )
);

CREATE POLICY "Organization creators can delete user roles"
ON user_roles
FOR DELETE
TO authenticated
USING (
  exists (
    select 1
    from organizations
    where organizations.id = user_roles.organization_id
    and organizations.created_by = auth.uid()
  )
);
