-- 020_unit_managers.sql

-- 1. Create table to track management history
CREATE TABLE IF NOT EXISTS unit_managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES org_units(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means currently active
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: No overlapping active periods for same unit? 
    -- For simplicity, we just enforce logic in the application/function, 
    -- but we could add an exclude constraint if needed.
    -- Ensure end_date >= start_date
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE unit_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_managers" ON unit_managers FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "org_admin_own_managers" ON unit_managers FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'organization_admin'));
CREATE POLICY "view_shared_managers" ON unit_managers FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Index
CREATE INDEX idx_unit_managers_unit ON unit_managers(unit_id);
CREATE INDEX idx_unit_managers_employee ON unit_managers(employee_id);
CREATE INDEX idx_unit_managers_active ON unit_managers(unit_id) WHERE end_date IS NULL;

-- 2. Function to Assign Manager safely
CREATE OR REPLACE FUNCTION assign_unit_manager(
    p_unit_id UUID,
    p_employee_id UUID,
    p_start_date DATE
) RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_current_manager_id UUID;
BEGIN
    -- Get Org ID
    SELECT organization_id INTO v_org_id FROM org_units WHERE id = p_unit_id;
    
    -- 1. Close current manager record if exists
    -- Find the record where end_date is null
    UPDATE unit_managers
    SET end_date = p_start_date - INTERVAL '1 day'
    WHERE unit_id = p_unit_id 
    AND end_date IS NULL;

    -- 2. Insert new record
    INSERT INTO unit_managers (organization_id, unit_id, employee_id, start_date)
    VALUES (v_org_id, p_unit_id, p_employee_id, p_start_date);

    -- 3. Update cache on org_units
    UPDATE org_units
    SET manager_id = p_employee_id,
        updated_at = NOW()
    WHERE id = p_unit_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
