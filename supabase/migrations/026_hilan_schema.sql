-- 026_hilan_schema.sql
-- Implements Phase 1 of the Hilan-like HR System

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organization Members (Ensuring it exists as per requirements, usually part of 001)
-- We assume 'organizations' and 'organization_members' exist. 
-- If they don't, we should create them, but based on context, they likely exist.
-- We will add a safety check or just proceed with employees which depends on them.

-- 3. Core Table: Employees
-- Re-creating employees table with new fields
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_number TEXT NOT NULL, -- Logical ID in the org
    id_number TEXT NOT NULL, -- Government ID (9 digits)
    is_passport BOOLEAN DEFAULT FALSE,
    
    -- Hebrew Names
    first_name_he TEXT, -- Short (max 7)
    last_name_he TEXT, -- Short (max 10)
    first_name_he_long TEXT, -- Max 50
    last_name_he_long TEXT, -- Max 50
    middle_name_he TEXT,
    father_name_he TEXT, -- Max 7
    
    birth_date DATE NOT NULL,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Constraints
    CONSTRAINT employees_org_emp_num_key UNIQUE (organization_id, employee_number),
    CONSTRAINT employees_org_id_num_key UNIQUE (organization_id, id_number)
);

-- 4. Event History: Employee Events
-- Central table for all temporal changes
CREATE TABLE IF NOT EXISTS employee_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    event_code TEXT NOT NULL, -- e.g., '200', '101'
    operation_code TEXT NOT NULL CHECK (operation_code IN (' ', '2', '3', '4')),
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    effective_from DATE,
    effective_to DATE,
    
    page_number TEXT, -- Document reference
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    CONSTRAINT valid_dates CHECK (effective_from <= effective_to)
);

-- 5. Name History (Event 552 specific tracking)
CREATE TABLE IF NOT EXISTS employee_name_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    first_name_he TEXT,
    last_name_he TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_id_num ON employees(id_number);
CREATE INDEX IF NOT EXISTS idx_events_emp_code ON employee_events(employee_id, event_code);
CREATE INDEX IF NOT EXISTS idx_events_dates ON employee_events(effective_from, effective_to);

-- 7. Functions

-- A. Validate Israeli ID
CREATE OR REPLACE FUNCTION validate_israeli_id(id_str text) RETURNS boolean AS $$
DECLARE
    sum integer := 0;
    digit integer;
    i integer;
BEGIN
    -- Check length (should be 9 digits, pad if necessary in app logic, but DB expects strict input?)
    -- Usually better to pad before calling, but let's be strict here.
    IF length(id_str) != 9 THEN
        RETURN FALSE;
    END IF;
    
    FOR i IN 1..9 LOOP
        digit := cast(substr(id_str, i, 1) as integer);
        IF i % 2 = 0 THEN
            digit := digit * 2;
        END IF;
        
        IF digit > 9 THEN
            digit := digit - 9;
        END IF;
        
        sum := sum + digit;
    END LOOP;
    
    RETURN sum % 10 = 0;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- B. Create Employee Event (Logic Hub)
CREATE OR REPLACE FUNCTION create_employee_event(
    p_organization_id uuid,
    p_employee_number text,
    p_id_number text,
    p_operation_code text,
    p_event_data jsonb,
    p_user_id uuid,
    p_event_code text DEFAULT '200'
) RETURNS jsonb AS $$
DECLARE
    v_employee_id uuid;
    v_event_id uuid;
    v_first_name text;
    v_last_name text;
    v_birth_date date;
BEGIN
    -- 1. Validate ID if '200' and new
    IF p_event_code = '200' THEN
        IF NOT validate_israeli_id(p_id_number) THEN
            RETURN json_build_object('success', false, 'error', 'Invalid Israeli ID number');
        END IF;
    END IF;

    -- 2. Handle 'New Employee' (Op Code ' ') for Event 200
    IF p_event_code = '200' AND p_operation_code = ' ' THEN
        -- Check duplicate
        SELECT id INTO v_employee_id FROM employees 
        WHERE organization_id = p_organization_id AND id_number = p_id_number;
        
        IF FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Employee already exists');
        END IF;
        
        -- Extract core fields from JSONB for employees table
        v_first_name := p_event_data->>'firstName';
        v_last_name := p_event_data->>'lastName';
        v_birth_date := (p_event_data->>'birthDate')::date;
        
        INSERT INTO employees (
            organization_id, employee_number, id_number, 
            first_name_he, last_name_he, birth_date, 
            created_by, is_active
        ) VALUES (
            p_organization_id, p_employee_number, p_id_number,
            v_first_name, v_last_name, v_birth_date,
            p_user_id, true
        ) RETURNING id INTO v_employee_id;
        
    ELSE
        -- For updates, find employee
        SELECT id INTO v_employee_id FROM employees 
        WHERE organization_id = p_organization_id 
        AND (id_number = p_id_number OR employee_number = p_employee_number);
        
        IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Employee not found');
        END IF;
        
        -- Update employees table if Event 200 Update
        IF p_event_code = '200' AND p_operation_code = '2' THEN
             UPDATE employees SET
                first_name_he = COALESCE(p_event_data->>'firstName', first_name_he),
                last_name_he = COALESCE(p_event_data->>'lastName', last_name_he)
             WHERE id = v_employee_id;
             
             -- Track name change history
             INSERT INTO employee_name_history (employee_id, first_name_he, last_name_he, changed_by)
             VALUES (v_employee_id, p_event_data->>'firstName', p_event_data->>'lastName', p_user_id);
        END IF;
    END IF;

    -- 3. Log Event
    INSERT INTO employee_events (
        organization_id, employee_id, event_code, operation_code, 
        event_data, created_by, processed
    ) VALUES (
        p_organization_id, v_employee_id, p_event_code, p_operation_code,
        p_event_data, p_user_id, true
    ) RETURNING id INTO v_event_id;

    RETURN json_build_object('success', true, 'employee_id', v_employee_id, 'event_id', v_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Delete Employee (Soft Delete)
CREATE OR REPLACE FUNCTION delete_employee(
    p_employee_id uuid,
    p_id_number_verification text,
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_id_number text;
BEGIN
    SELECT id_number INTO v_id_number FROM employees WHERE id = p_employee_id;
    
    IF v_id_number != p_id_number_verification THEN
        RETURN json_build_object('success', false, 'error', 'ID verification failed');
    END IF;
    
    UPDATE employees 
    SET deleted_at = NOW(), is_active = false 
    WHERE id = p_employee_id;
    
    INSERT INTO employee_events (
        organization_id, employee_id, event_code, operation_code, 
        event_data, created_by, processed
    )
    SELECT organization_id, id, '200', '3', '{"reason": "Manual deletion"}'::jsonb, p_user_id, true
    FROM employees WHERE id = p_employee_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policies

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_events ENABLE ROW LEVEL SECURITY;

-- Employees Read
CREATE POLICY "Users can view employees in their organization"
ON employees FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Employees Write (Admins)
CREATE POLICY "Admins can create employees"
ON employees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = employees.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Events Write
CREATE POLICY "Users can create events for their org employees"
ON employee_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN organization_members om ON e.organization_id = om.organization_id
    WHERE e.id = employee_events.employee_id
    AND om.user_id = auth.uid()
  )
);

-- Events Read
CREATE POLICY "Users can view events for their org employees"
ON employee_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN organization_members om ON e.organization_id = om.organization_id
    WHERE e.id = employee_events.employee_id
    AND om.user_id = auth.uid()
  )
);
