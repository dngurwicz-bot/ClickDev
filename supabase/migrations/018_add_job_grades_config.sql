-- Add enable_job_grades to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS enable_job_grades BOOLEAN DEFAULT TRUE;
