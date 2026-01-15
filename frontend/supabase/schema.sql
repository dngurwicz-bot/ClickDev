-- ============================================
-- CLICK HR Platform - Complete Database Schema
-- Multi-Tenant SaaS with History Tracking
-- ============================================

-- 1. RESET (Careful - preserves auth.users)
DROP SCHEMA public CASCADE; 
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres; 
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Organizations (ארגונים)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  logo_url TEXT,
  address TEXT,
  active_modules JSONB DEFAULT '["core"]'::jsonb,
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- User Roles (תפקידים)
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'organization_admin', 'manager', 'employee');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Legacy profiles table (for backward compatibility)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (עובדים - ההווה)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Info (זהות)
  id_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  first_name_en VARCHAR(100),
  last_name_en VARCHAR(100),
  birth_date DATE,
  gender VARCHAR(10),
  
  -- Contact (יצירת קשר)
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  
  -- Employment (תעסוקה)
  employee_number VARCHAR(50) UNIQUE,
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50),
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  manager_id UUID REFERENCES employees(id),
  
  -- Financial (כספים)
  salary DECIMAL(10,2),
  salary_currency VARCHAR(3) DEFAULT 'ILS',
  bank_name VARCHAR(100),
  bank_branch VARCHAR(10),
  bank_account VARCHAR(20),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  termination_date DATE,
  termination_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Employee History (היסטוריה - מכונת הזמן)
CREATE TABLE employee_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee User Mapping (קישור עובד למשתמש)
CREATE TABLE employee_user_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_id_number ON employees(id_number);
CREATE INDEX idx_history_employee ON employee_history(employee_id);
CREATE INDEX idx_history_valid_from ON employee_history(valid_from);
CREATE INDEX idx_history_field ON employee_history(field_name);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_org ON user_roles(organization_id);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- History Tracking Trigger (הטריגר הקריטי!)
CREATE OR REPLACE FUNCTION track_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track job_title changes
  IF OLD.job_title IS DISTINCT FROM NEW.job_title THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'job_title',
      OLD.job_title, NEW.job_title, NOW(), auth.uid()
    );
  END IF;
  
  -- Track salary changes
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'salary',
      OLD.salary::TEXT, NEW.salary::TEXT, NOW(), auth.uid()
    );
  END IF;
  
  -- Track department changes
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'department',
      OLD.department, NEW.department, NOW(), auth.uid()
    );
  END IF;
  
  -- Track manager changes
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'manager_id',
      OLD.manager_id::TEXT, NEW.manager_id::TEXT, NOW(), auth.uid()
    );
  END IF;
  
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'status',
      OLD.status, NEW.status, NOW(), auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER employee_changes_trigger
  AFTER UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION track_employee_changes();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_user_mapping ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "super_admin_all_orgs" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "org_admin_own_org" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'organization_admin'
    )
  );

-- User Roles Policies
CREATE POLICY "users_own_roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "super_admin_manage_roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Profiles Policies
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "super_admin_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Employees Policies
CREATE POLICY "super_admin_all_employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "org_admin_own_employees" ON employees
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('organization_admin', 'manager')
    )
  );

CREATE POLICY "employee_own_record" ON employees
  FOR SELECT USING (
    id IN (
      SELECT employee_id FROM employee_user_mapping 
      WHERE user_id = auth.uid()
    )
  );

-- Employee History Policies
CREATE POLICY "super_admin_all_history" ON employee_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "org_admin_own_history" ON employee_history
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('organization_admin', 'manager')
    )
  );

-- Employee User Mapping Policies
CREATE POLICY "users_own_mapping" ON employee_user_mapping
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "super_admin_all_mappings" ON employee_user_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role_enum AS $$
  SELECT role FROM user_roles 
  WHERE user_id = p_user_id 
  AND role = 'super_admin'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
