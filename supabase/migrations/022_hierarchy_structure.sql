-- 022_hierarchy_structure.sql

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS hierarchy_structure JSONB DEFAULT '{}'::jsonb;
