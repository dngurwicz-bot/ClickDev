-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role_enum type
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'organization_admin', 'manager', 'employee');

-- 1. Organizations table
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

-- 2. User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 3. Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Info
  id_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  first_name_en VARCHAR(100),
  last_name_en VARCHAR(100),
  birth_date DATE,
  gender VARCHAR(10),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  
  -- Employment
  employee_number VARCHAR(50) UNIQUE,
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50),
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  manager_id UUID REFERENCES employees(id),
  
  -- Financial
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

-- 4. Employee history table
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

-- 5. Employee user mapping table
CREATE TABLE employee_user_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_user_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "super_admin_all_access" ON organizations
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

-- RLS Policies for user_roles
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

-- RLS Policies for employees
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

-- RLS Policies for employee_history
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

-- RLS Policies for employee_user_mapping
CREATE POLICY "users_own_mapping" ON employee_user_mapping
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_history_employee ON employee_history(employee_id);
CREATE INDEX idx_history_valid_from ON employee_history(valid_from);
CREATE INDEX idx_history_field ON employee_history(field_name);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_org ON user_roles(organization_id);
