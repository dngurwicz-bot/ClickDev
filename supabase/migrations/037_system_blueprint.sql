-- 037_system_blueprint.sql
-- Normalized schema for CLICK System Blueprint domain

CREATE TABLE IF NOT EXISTS system_blueprint_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_key TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'he-IL',
    direction TEXT NOT NULL CHECK (direction IN ('rtl', 'ltr')),
    positioning TEXT NOT NULL,
    last_updated DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_blueprint_target_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    company_type TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL CHECK (phase_number >= 1),
    name TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, phase_number)
);

CREATE TABLE IF NOT EXISTS system_blueprint_phase_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES system_blueprint_phases(id) ON DELETE CASCADE,
    deliverable TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(phase_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    for_who TEXT NOT NULL,
    description TEXT NOT NULL,
    is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, module_key),
    UNIQUE(version_id, display_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_module_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES system_blueprint_modules(id) ON DELETE CASCADE,
    capability TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_module_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES system_blueprint_modules(id) ON DELETE CASCADE,
    kpi_key TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    channel_key TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_alert_engines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_alert_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engine_id UUID NOT NULL REFERENCES system_blueprint_alert_engines(id) ON DELETE CASCADE,
    example_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(engine_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_escalation_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    policy_key TEXT NOT NULL,
    policy_value TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, policy_key),
    UNIQUE(version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_core_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    entity_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS system_blueprint_integration_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES system_blueprint_versions(id) ON DELETE CASCADE,
    target_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(version_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_system_blueprint_versions_published
    ON system_blueprint_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_system_blueprint_phases_version
    ON system_blueprint_phases(version_id);
CREATE INDEX IF NOT EXISTS idx_system_blueprint_modules_version
    ON system_blueprint_modules(version_id);
CREATE INDEX IF NOT EXISTS idx_system_blueprint_alert_engines_version
    ON system_blueprint_alert_engines(version_id);

CREATE OR REPLACE FUNCTION set_system_blueprint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_blueprint_versions_updated_at_trigger
    ON system_blueprint_versions;
CREATE TRIGGER system_blueprint_versions_updated_at_trigger
BEFORE UPDATE ON system_blueprint_versions
FOR EACH ROW
EXECUTE FUNCTION set_system_blueprint_updated_at();

DROP TRIGGER IF EXISTS system_blueprint_phases_updated_at_trigger
    ON system_blueprint_phases;
CREATE TRIGGER system_blueprint_phases_updated_at_trigger
BEFORE UPDATE ON system_blueprint_phases
FOR EACH ROW
EXECUTE FUNCTION set_system_blueprint_updated_at();

DROP TRIGGER IF EXISTS system_blueprint_modules_updated_at_trigger
    ON system_blueprint_modules;
CREATE TRIGGER system_blueprint_modules_updated_at_trigger
BEFORE UPDATE ON system_blueprint_modules
FOR EACH ROW
EXECUTE FUNCTION set_system_blueprint_updated_at();

DROP TRIGGER IF EXISTS system_blueprint_alert_engines_updated_at_trigger
    ON system_blueprint_alert_engines;
CREATE TRIGGER system_blueprint_alert_engines_updated_at_trigger
BEFORE UPDATE ON system_blueprint_alert_engines
FOR EACH ROW
EXECUTE FUNCTION set_system_blueprint_updated_at();

ALTER TABLE system_blueprint_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_target_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_phase_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_module_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_module_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_alert_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_alert_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_escalation_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_blueprint_integration_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_versions"
ON system_blueprint_versions
FOR SELECT
TO anon, authenticated
USING (is_published = TRUE);

CREATE POLICY "super_admin_manage_versions"
ON system_blueprint_versions
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_target_companies"
ON system_blueprint_target_companies
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_target_companies"
ON system_blueprint_target_companies
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_phases"
ON system_blueprint_phases
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_phases"
ON system_blueprint_phases
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_phase_deliverables"
ON system_blueprint_phase_deliverables
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_phases p
        JOIN system_blueprint_versions v ON v.id = p.version_id
        WHERE p.id = phase_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_phase_deliverables"
ON system_blueprint_phase_deliverables
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_modules"
ON system_blueprint_modules
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_modules"
ON system_blueprint_modules
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_module_capabilities"
ON system_blueprint_module_capabilities
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_modules m
        JOIN system_blueprint_versions v ON v.id = m.version_id
        WHERE m.id = module_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_module_capabilities"
ON system_blueprint_module_capabilities
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_module_kpis"
ON system_blueprint_module_kpis
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_modules m
        JOIN system_blueprint_versions v ON v.id = m.version_id
        WHERE m.id = module_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_module_kpis"
ON system_blueprint_module_kpis
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_notification_channels"
ON system_blueprint_notification_channels
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_notification_channels"
ON system_blueprint_notification_channels
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_alert_engines"
ON system_blueprint_alert_engines
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_alert_engines"
ON system_blueprint_alert_engines
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_alert_examples"
ON system_blueprint_alert_examples
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_alert_engines e
        JOIN system_blueprint_versions v ON v.id = e.version_id
        WHERE e.id = engine_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_alert_examples"
ON system_blueprint_alert_examples
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_escalation_policy"
ON system_blueprint_escalation_policy
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_escalation_policy"
ON system_blueprint_escalation_policy
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_core_entities"
ON system_blueprint_core_entities
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_core_entities"
ON system_blueprint_core_entities
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

CREATE POLICY "public_read_published_integration_targets"
ON system_blueprint_integration_targets
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM system_blueprint_versions v
        WHERE v.id = version_id
        AND v.is_published = TRUE
    )
);

CREATE POLICY "super_admin_manage_integration_targets"
ON system_blueprint_integration_targets
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());
