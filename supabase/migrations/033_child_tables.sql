-- 033_child_tables.sql
-- Implements Child Tables for Employee Master-Detail View
-- Includes: Family (Kids), Bank Details, Role History, Assets

-- 1. Employee Children (Family)
CREATE TABLE IF NOT EXISTS employee_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    first_name TEXT NOT NULL,
    last_name TEXT,
    id_number TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
    
    -- Validity for historical tracking
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_child_dates CHECK (valid_from <= valid_to)
);

-- 2. Employee Bank Details
CREATE TABLE IF NOT EXISTS employee_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    bank_code TEXT NOT NULL,
    branch_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_owner_name TEXT,
    
    -- Validity
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_bank_dates CHECK (valid_from <= valid_to)
);

-- 3. Employee Role History
-- Tracks changes in Position, Grade, and Org Assignment
CREATE TABLE IF NOT EXISTS employee_role_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Org Structure Links
    org_unit_id UUID REFERENCES org_units(id), -- The lowest level unit assigned
    
    -- Job Details
    job_title TEXT,
    job_grade_id UUID REFERENCES job_grades(id),
    rank TEXT,
    scope_percentage NUMERIC(5,2) DEFAULT 100.00,
    
    -- Validity
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_role_dates CHECK (valid_from <= valid_to)
);

-- 4. Employee Assets
CREATE TABLE IF NOT EXISTS employee_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL, -- 'Laptop', 'Car', 'Phone', etc.
    serial_number TEXT,
    description TEXT,
    status TEXT DEFAULT 'Assigned', -- 'Assigned', 'Returned', 'Lost'
    
    -- Assignment Dates
    issued_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_asset_dates CHECK (issued_date <= return_date)
);

-- 5. RLS Policies
-- Enable RLS
ALTER TABLE employee_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_role_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assets ENABLE ROW LEVEL SECURITY;

-- Generic Read Policy (Organization members can view)
CREATE POLICY "Users can view child tables in their org" ON employee_children
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view bank details in their org" ON employee_bank_details
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view role history in their org" ON employee_role_history
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view assets in their org" ON employee_assets
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Generic Write Policy (Admins/HR can write)
-- Note: Simplified for now, assuming organization_members handles roles
CREATE POLICY "Org Admins can manage child tables" ON employee_children
FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())); -- AND role in ('admin', 'owner') usually

CREATE POLICY "Org Admins can manage bank details" ON employee_bank_details
FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org Admins can manage role history" ON employee_role_history
FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org Admins can manage assets" ON employee_assets
FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
