-- 039_priority_shell_behavior.sql
-- Priority-like shell behavior persistence for CLICK

CREATE TABLE IF NOT EXISTS ui_home_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    widgets_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS ui_shortcut_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_shortcuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES ui_shortcut_groups(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_key TEXT,
    label TEXT NOT NULL,
    route TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    screen_key TEXT NOT NULL,
    name TEXT NOT NULL,
    filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_active_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    route TEXT NOT NULL,
    screen_key TEXT,
    title TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id, session_id, route)
);

CREATE INDEX IF NOT EXISTS idx_ui_home_layouts_org_user ON ui_home_layouts(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ui_shortcut_groups_org_user ON ui_shortcut_groups(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ui_saved_searches_org_user_screen ON ui_saved_searches(organization_id, user_id, screen_key);
CREATE INDEX IF NOT EXISTS idx_ui_active_screens_org_user ON ui_active_screens(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ui_active_screens_last_seen_desc ON ui_active_screens(last_seen_at DESC);

CREATE OR REPLACE FUNCTION touch_ui_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ui_home_layouts_updated_at ON ui_home_layouts;
CREATE TRIGGER trg_ui_home_layouts_updated_at
BEFORE UPDATE ON ui_home_layouts
FOR EACH ROW EXECUTE FUNCTION touch_ui_updated_at();

DROP TRIGGER IF EXISTS trg_ui_saved_searches_updated_at ON ui_saved_searches;
CREATE TRIGGER trg_ui_saved_searches_updated_at
BEFORE UPDATE ON ui_saved_searches
FOR EACH ROW EXECUTE FUNCTION touch_ui_updated_at();

ALTER TABLE ui_home_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_shortcut_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_active_screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ui_home_layouts_user_access" ON ui_home_layouts;
CREATE POLICY "ui_home_layouts_user_access" ON ui_home_layouts
FOR ALL USING (
    user_id = auth.uid() AND (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "ui_shortcut_groups_user_access" ON ui_shortcut_groups;
CREATE POLICY "ui_shortcut_groups_user_access" ON ui_shortcut_groups
FOR ALL USING (
    user_id = auth.uid() AND (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "ui_shortcuts_user_access" ON ui_shortcuts;
CREATE POLICY "ui_shortcuts_user_access" ON ui_shortcuts
FOR ALL USING (
    group_id IN (
        SELECT g.id FROM ui_shortcut_groups g
        WHERE g.user_id = auth.uid() AND (
            g.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
            OR g.organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "ui_saved_searches_user_access" ON ui_saved_searches;
CREATE POLICY "ui_saved_searches_user_access" ON ui_saved_searches
FOR ALL USING (
    user_id = auth.uid() AND (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "ui_active_screens_user_access" ON ui_active_screens;
CREATE POLICY "ui_active_screens_user_access" ON ui_active_screens
FOR ALL USING (
    user_id = auth.uid() AND (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
    )
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_org_created ON user_activity_logs(organization_id, created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activity_logs_self_select" ON user_activity_logs;
CREATE POLICY "user_activity_logs_self_select" ON user_activity_logs
FOR SELECT USING (
    user_id = auth.uid() OR (
        organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'organization_admin'))
    )
);

DROP POLICY IF EXISTS "user_activity_logs_admin_insert" ON user_activity_logs;
CREATE POLICY "user_activity_logs_admin_insert" ON user_activity_logs
FOR INSERT WITH CHECK (
    user_id = auth.uid() OR (
        organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'organization_admin'))
    )
);
