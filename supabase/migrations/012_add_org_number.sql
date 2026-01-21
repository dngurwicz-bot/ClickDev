-- Add organization number column
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_number VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_org_number ON organizations(org_number);
