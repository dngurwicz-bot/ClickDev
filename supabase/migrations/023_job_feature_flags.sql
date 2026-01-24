-- 023_job_feature_flags.sql

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS use_job_grades BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS use_job_titles BOOLEAN DEFAULT FALSE;
