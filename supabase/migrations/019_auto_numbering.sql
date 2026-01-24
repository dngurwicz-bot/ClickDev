-- 019_auto_numbering.sql

-- 1. Add number columns
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS unit_number VARCHAR(10);
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS job_number VARCHAR(10);

-- 2. Function to generate Unit Number
CREATE OR REPLACE FUNCTION generate_org_unit_number() RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Only generate if not provided
    IF NEW.unit_number IS NULL THEN
        -- Lock to prevent race conditions (simple approach: advisory lock based on org_id + type hash?)
        -- Or just use a subquery that is atomic enough for this scale.
        -- Let's use max(cast(unit_number as int)) where type matches.
        
        -- We filter by organization_id AND type
        SELECT COALESCE(MAX(NULLIF(regexp_replace(unit_number, '\D','','g'), '')::INTEGER), 0) + 1
        INTO next_num
        FROM org_units
        WHERE organization_id = NEW.organization_id
        AND type = NEW.type;

        -- Format as 3 digits
        NEW.unit_number := LPAD(next_num::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to generate Job Number
CREATE OR REPLACE FUNCTION generate_job_number() RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.job_number IS NULL THEN
        SELECT COALESCE(MAX(NULLIF(regexp_replace(job_number, '\D','','g'), '')::INTEGER), 0) + 1
        INTO next_num
        FROM job_titles
        WHERE organization_id = NEW.organization_id;

        NEW.job_number := LPAD(next_num::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Triggers
DROP TRIGGER IF EXISTS set_org_unit_number ON org_units;
CREATE TRIGGER set_org_unit_number
BEFORE INSERT ON org_units
FOR EACH ROW
EXECUTE FUNCTION generate_org_unit_number();

DROP TRIGGER IF EXISTS set_job_number ON job_titles;
CREATE TRIGGER set_job_number
BEFORE INSERT ON job_titles
FOR EACH ROW
EXECUTE FUNCTION generate_job_number();

-- 5. Backfill existing data (Optional, but good for "Professional" request)
-- We need to do this carefully. 
-- For now, let's leave existing data null or update them via a separate scripts if needed.
-- But the user said "Each ... should get". I should probably backfill.

DO $$
DECLARE
    r RECORD;
    num INTEGER;
    current_type TEXT;
    current_org UUID;
BEGIN
    -- Backfill Org Units
    FOR r IN SELECT * FROM org_units WHERE unit_number IS NULL ORDER BY organization_id, type, created_at LOOP
        -- Reset counter if org or type changes
        IF current_org IS DISTINCT FROM r.organization_id OR current_type IS DISTINCT FROM r.type THEN
            num := 1;
            current_org := r.organization_id;
            current_type := r.type;
        ELSE
            num := num + 1;
        END IF;
        
        UPDATE org_units SET unit_number = LPAD(num::TEXT, 3, '0') WHERE id = r.id;
    END LOOP;

    -- Backfill Job Titles
    current_org := NULL;
    FOR r IN SELECT * FROM job_titles WHERE job_number IS NULL ORDER BY organization_id, created_at LOOP
         IF current_org IS DISTINCT FROM r.organization_id THEN
            num := 1;
            current_org := r.organization_id;
        ELSE
            num := num + 1;
        END IF;

        UPDATE job_titles SET job_number = LPAD(num::TEXT, 3, '0') WHERE id = r.id;
    END LOOP;
END $$;
