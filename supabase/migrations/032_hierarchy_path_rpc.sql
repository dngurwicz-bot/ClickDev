-- 032_hierarchy_path_rpc.sql

-- Function to get the full hierarchy path for a given Org Unit
-- Returns an array of JSONB objects [{id, name, type}, ...] from Root to Leaf

CREATE OR REPLACE FUNCTION get_unit_hierarchy_path(p_unit_id uuid)
RETURNS jsonb AS $$
WITH RECURSIVE unit_path AS (
    -- Base case: the requested unit
    SELECT id, name, type, parent_id, 1 as depth
    FROM org_units
    WHERE id = p_unit_id
    
    UNION ALL
    
    -- Recursive step: get parent
    SELECT p.id, p.name, p.type, p.parent_id, up.depth + 1
    FROM org_units p
    JOIN unit_path up ON p.id = up.parent_id
)
SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', type) ORDER BY depth DESC)
FROM unit_path;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
