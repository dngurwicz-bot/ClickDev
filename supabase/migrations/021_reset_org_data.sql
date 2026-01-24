-- 021_reset_org_data.sql

-- Truncate tables with cascade to clear all data
TRUNCATE TABLE 
    unit_managers,
    position_history,
    org_unit_history,
    positions,
    org_units,
    job_titles,
    job_grades
CASCADE;
