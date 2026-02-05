-- 031_enforce_org_structure_rules.sql
-- 1. Prevent changing the HIERARCHY DEFINITION (Levels) if locked.
-- 2. Prevent adding Org Units that violate the defined Hierarchy.

-- A. Trigger for ORGANIZATIONS table: Lock configuration
CREATE OR REPLACE FUNCTION protect_org_config()
RETURNS TRIGGER AS $$
BEGIN
    -- If trying to change config_lock from true to false (unlocking), allow it (only super admin should can, but logic allows)
    -- If currently locked, prevent changes to hierarchy columns
    IF OLD.config_lock = true THEN
         IF OLD.hierarchy_levels IS DISTINCT FROM NEW.hierarchy_levels OR
            OLD.hierarchy_structure IS DISTINCT FROM NEW.hierarchy_structure THEN
            RAISE EXCEPTION 'Organization structure definitions are locked and cannot be modified.';
         END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_org_config_trigger ON organizations;
CREATE TRIGGER protect_org_config_trigger
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION protect_org_config();


-- B. Trigger for ORG_UNITS table: Enforce Data Integrity against Structure
CREATE OR REPLACE FUNCTION validate_org_unit_compliance()
RETURNS TRIGGER AS $$
DECLARE
    v_levels text[];
    v_structure jsonb;
    v_parent_type text;
    v_expected_parent_type text;
BEGIN
    -- Get Org Config
    SELECT hierarchy_levels, hierarchy_structure::jsonb INTO v_levels, v_structure
    FROM organizations WHERE id = NEW.organization_id;

    -- 1. Check if Type is allowed
    IF NOT (NEW.type = ANY(v_levels)) THEN
        RAISE EXCEPTION 'Invalid Unit Type: %. Allowed types: %', NEW.type, v_levels;
    END IF;

    -- 2. Check Parent-Child Logic
    -- Get expected parent type from structure map
    v_expected_parent_type := v_structure->>NEW.type;

    IF v_expected_parent_type IS NULL THEN
        -- It's a root level (e.g. Division), should not have a parent (or parent optional if top?)
        -- Usually top level has no parent.
        IF NEW.parent_id IS NOT NULL THEN
             -- Check if parent is actually null or if we allow nesting same type? No, usually strict.
             -- Let's just warn or allow strict root.
             -- For now, if defined as root, parent should be NULL.
             RAISE EXCEPTION 'Unit of type % is defined as a Root Level, but a Parent ID was provided.', NEW.type;
        END IF;
    ELSE
        -- It MUST have a parent of the expected type
        IF NEW.parent_id IS NULL THEN
             RAISE EXCEPTION 'Unit of type % must have a parent of type %.', NEW.type, v_expected_parent_type;
        END IF;

        -- Verify Parent's Type
        SELECT type INTO v_parent_type FROM org_units WHERE id = NEW.parent_id;
        
        IF v_parent_type != v_expected_parent_type THEN
            RAISE EXCEPTION 'Invalid Parent Type. Expected %, found %.', v_expected_parent_type, v_parent_type;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_org_unit_compliance_trigger ON org_units;
CREATE TRIGGER validate_org_unit_compliance_trigger
BEFORE INSERT OR UPDATE ON org_units
FOR EACH ROW
EXECUTE FUNCTION validate_org_unit_compliance();
