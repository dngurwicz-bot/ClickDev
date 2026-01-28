-- 024_employee_address.sql - Event 218 Address Management (Hilan-Style)

-- Create employee_address table for temporal address tracking
CREATE TABLE IF NOT EXISTS employee_address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

    -- Address Fields (Hilan Event 218)
    city_name VARCHAR(100),           -- שם יישוב
    city_code VARCHAR(20),            -- סמל יישוב
    street VARCHAR(200),              -- רחוב
    house_number VARCHAR(20),         -- בית
    apartment VARCHAR(20),            -- דירה
    entrance VARCHAR(10),             -- כניסה
    postal_code VARCHAR(10),          -- מיקוד
    phone VARCHAR(20),                -- טלפון

    -- PO Box Fields
    po_box VARCHAR(20),               -- ת. דואר
    po_box_city VARCHAR(100),         -- ישוב ת. דואר
    po_box_postal_code VARCHAR(10),   -- מיקוד ת. דואר

    -- Temporal Fields (Type C Logic)
    valid_from DATE NOT NULL,         -- תאריך תוקף
    valid_to DATE,                    -- גמר תוקף (NULL = current/active)

    -- Audit Fields
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE employee_address ENABLE ROW LEVEL SECURITY;

-- RLS Policies (following existing patterns from 016_click_core.sql)

-- Super Admin: Full access to all address records
CREATE POLICY "super_admin_all_employee_address" ON employee_address
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Organization Admin/Manager: Access to own organization's records
CREATE POLICY "org_admin_own_employee_address" ON employee_address
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('organization_admin', 'manager')
        )
    );

-- Employee: Read-only access to own address records
CREATE POLICY "employee_own_address" ON employee_address
    FOR SELECT USING (
        employee_id IN (
            SELECT employee_id FROM employee_user_mapping WHERE user_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX idx_employee_address_employee ON employee_address(employee_id);
CREATE INDEX idx_employee_address_org ON employee_address(organization_id);
CREATE INDEX idx_employee_address_valid_from ON employee_address(valid_from DESC);
CREATE INDEX idx_employee_address_city_code ON employee_address(city_code);
CREATE INDEX idx_employee_address_active ON employee_address(employee_id, valid_to) WHERE valid_to IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_employee_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_address_updated_at_trigger
    BEFORE UPDATE ON employee_address
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_address_updated_at();
