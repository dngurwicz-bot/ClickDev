-- 016_click_core.sql for CLICK CORE Module

-- 1. Update Organizations Table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS hierarchy_levels TEXT[] DEFAULT ARRAY['Wing', 'Department', 'Team'],
ADD COLUMN IF NOT EXISTS config_lock BOOLEAN DEFAULT FALSE;

-- 2. Job Grades Catalog
CREATE TABLE IF NOT EXISTS job_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL, -- 1=Entry, 10=C-Level
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, level),
    UNIQUE(organization_id, name)
);

-- 3. Job Titles Catalog
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(100) NOT NULL,
    default_grade_id UUID REFERENCES job_grades(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, title)
);

-- 4. Org Units (Recursive Hierarchy)
CREATE TABLE IF NOT EXISTS org_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES org_units(id) ON DELETE CASCADE, -- Recursive
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Wing, Department, etc. Matches hierarchy_levels
    manager_id UUID REFERENCES employees(id), -- Head of this unit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Positions (The "Slot" in the Org)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    org_unit_id UUID REFERENCES org_units(id) ON DELETE CASCADE, -- Optional (can be direct to Org?) Prompt says "linked to Department... or directly to Wing"
    job_title_id UUID REFERENCES job_titles(id),
    is_manager_position BOOLEAN DEFAULT FALSE,
    occupant_id UUID REFERENCES employees(id), -- Current holder
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Org Unit History (Time Machine)
CREATE TABLE IF NOT EXISTS org_unit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_unit_id UUID REFERENCES org_units(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    valid_from TIMESTAMPTZ NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Position History (Time Machine)
CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    field_name VARCHAR(100) NOT NULL, -- e.g. 'occupant_id', 'org_unit_id'
    old_value TEXT,
    new_value TEXT,
    valid_from TIMESTAMPTZ NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS
ALTER TABLE job_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_unit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

-- 9. Basic RLS Policies (Super Admin & Org Admin)
-- Job Grades
CREATE POLICY "super_admin_all_job_grades" ON job_grades FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "org_admin_own_job_grades" ON job_grades FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'organization_admin'));
CREATE POLICY "view_shared_job_grades" ON job_grades FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Job Titles
CREATE POLICY "super_admin_all_job_titles" ON job_titles FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "org_admin_own_job_titles" ON job_titles FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'organization_admin'));
CREATE POLICY "view_shared_job_titles" ON job_titles FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Org Units
CREATE POLICY "super_admin_all_org_units" ON org_units FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "org_admin_own_org_units" ON org_units FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'organization_admin'));
CREATE POLICY "view_shared_org_units" ON org_units FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Positions
CREATE POLICY "super_admin_all_positions" ON positions FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "org_admin_own_positions" ON positions FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'organization_admin'));
CREATE POLICY "view_shared_positions" ON positions FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Helper Function for Triggers (Generic History Tracker?)
-- For now, we reuse the pattern but specific to tables

-- Trigger for Org Units
CREATE OR REPLACE FUNCTION track_org_unit_changes() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO org_unit_history (org_unit_id, organization_id, field_name, old_value, new_value, valid_from, changed_by)
    VALUES (OLD.id, OLD.organization_id, 'name', OLD.name, NEW.name, NOW(), auth.uid());
  END IF;
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    INSERT INTO org_unit_history (org_unit_id, organization_id, field_name, old_value, new_value, valid_from, changed_by)
    VALUES (OLD.id, OLD.organization_id, 'parent_id', OLD.parent_id::text, NEW.parent_id::text, NOW(), auth.uid());
  END IF;
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
     INSERT INTO org_unit_history (org_unit_id, organization_id, field_name, old_value, new_value, valid_from, changed_by)
    VALUES (OLD.id, OLD.organization_id, 'manager_id', OLD.manager_id::text, NEW.manager_id::text, NOW(), auth.uid());
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER org_unit_changes_trigger
AFTER UPDATE ON org_units
FOR EACH ROW EXECUTE FUNCTION track_org_unit_changes();

-- Trigger for Positions
CREATE OR REPLACE FUNCTION track_position_changes() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.occupant_id IS DISTINCT FROM NEW.occupant_id THEN
    INSERT INTO position_history (position_id, organization_id, field_name, old_value, new_value, valid_from, changed_by)
    VALUES (OLD.id, OLD.organization_id, 'occupant_id', OLD.occupant_id::text, NEW.occupant_id::text, NOW(), auth.uid());
  END IF;
   IF OLD.job_title_id IS DISTINCT FROM NEW.job_title_id THEN
    INSERT INTO position_history (position_id, organization_id, field_name, old_value, new_value, valid_from, changed_by)
    VALUES (OLD.id, OLD.organization_id, 'job_title_id', OLD.job_title_id::text, NEW.job_title_id::text, NOW(), auth.uid());
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER position_changes_trigger
AFTER UPDATE ON positions
FOR EACH ROW EXECUTE FUNCTION track_position_changes();

-- Create Indexes
CREATE INDEX idx_org_units_parent ON org_units(parent_id);
CREATE INDEX idx_org_units_org ON org_units(organization_id);
CREATE INDEX idx_positions_org ON positions(organization_id);
CREATE INDEX idx_positions_unit ON positions(org_unit_id);
CREATE INDEX idx_positions_job ON positions(job_title_id);
CREATE INDEX idx_positions_occupant ON positions(occupant_id);
