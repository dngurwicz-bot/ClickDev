-- Explicitly allow service_role to do anything on organizations table
-- This is usually default but sometimes needs to be explicit if conflicting policies exist

CREATE POLICY "service_role_all_access" ON organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
