-- 035_fix_rls_super_admin.sql
-- Grant super_admin global access to employee-related tables

-- 1. Employees
DROP POLICY IF EXISTS "Users can view employees in their organization" ON employees;
CREATE POLICY "Users can view employees in their organization"
ON employees FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())) 
  OR 
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);

-- 2. Employee Events
DROP POLICY IF EXISTS "Users can view events for their org employees" ON employee_events;
CREATE POLICY "Users can view events for their org employees"
ON employee_events FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);

-- 3. Employee Name History
DROP POLICY IF EXISTS "Users can view name history for their org employees" ON employee_name_history;
CREATE POLICY "Users can view name history for their org employees"
ON employee_name_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    LEFT JOIN user_roles ur ON e.organization_id = ur.organization_id
    WHERE e.id = employee_name_history.employee_id
    AND (ur.user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
  )
);

-- 4. Employee Address
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON employee_address;
CREATE POLICY "Users can view address for their org employees"
ON employee_address FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);

-- 5. Employee Children
DROP POLICY IF EXISTS "Enable all for authenticated users" ON employee_children;
CREATE POLICY "Users can view children for their org employees"
ON employee_children FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);

-- 6. Employee Role History
DROP POLICY IF EXISTS "Enable all for authenticated users" ON employee_role_history;
CREATE POLICY "Users can view role history for their org employees"
ON employee_role_history FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);

-- 7. Employee Basic Info (Legacy/Hilan Phase 1)
DROP POLICY IF EXISTS "Users can view employees in their organization" ON employee_basic_info;
CREATE POLICY "Users can view basic info for their org employees"
ON employee_basic_info FOR SELECT
USING (
  (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role_enum))
);
