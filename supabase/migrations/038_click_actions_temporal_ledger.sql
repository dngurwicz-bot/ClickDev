-- 038_click_actions_temporal_ledger.sql
-- CLICK CORE unique temporal model:
-- 1) Action Journal (CLICK Actions)
-- 2) Standard valid_from / valid_to temporal fields
-- 3) Indexes + constraints for non-overlapping temporal handling in app layer

CREATE TABLE IF NOT EXISTS employee_action_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action_key TEXT NOT NULL,
    action_version INTEGER NOT NULL DEFAULT 1,
    effective_at DATE NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_before_json JSONB,
    snapshot_after_json JSONB,
    correlation_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_action_journal_correlation
ON employee_action_journal (organization_id, employee_id, correlation_id);

CREATE INDEX IF NOT EXISTS idx_employee_action_journal_employee_effective
ON employee_action_journal (organization_id, employee_id, effective_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_action_journal_action_key
ON employee_action_journal (action_key, created_at DESC);

ALTER TABLE employee_action_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view action journal in their org" ON employee_action_journal;
CREATE POLICY "Users can view action journal in their org"
ON employee_action_journal FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Org Admins can manage action journal" ON employee_action_journal;
CREATE POLICY "Org Admins can manage action journal"
ON employee_action_journal FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

ALTER TABLE employee_assets
    ADD COLUMN IF NOT EXISTS valid_from DATE,
    ADD COLUMN IF NOT EXISTS valid_to DATE;

UPDATE employee_assets
SET valid_from = COALESCE(valid_from, issued_date, CURRENT_DATE),
    valid_to = COALESCE(valid_to, return_date)
WHERE valid_from IS NULL OR valid_to IS DISTINCT FROM return_date;

ALTER TABLE employee_assets
    ALTER COLUMN valid_from SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_asset_temporal_dates'
    ) THEN
        ALTER TABLE employee_assets
        ADD CONSTRAINT valid_asset_temporal_dates
        CHECK (valid_to IS NULL OR valid_from <= valid_to);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_address_temporal_dates'
    ) THEN
        ALTER TABLE employee_address
        ADD CONSTRAINT valid_address_temporal_dates
        CHECK (valid_to IS NULL OR valid_from <= valid_to);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_child_temporal_dates'
    ) THEN
        ALTER TABLE employee_children
        ADD CONSTRAINT valid_child_temporal_dates
        CHECK (valid_to IS NULL OR valid_from <= valid_to);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_bank_temporal_dates'
    ) THEN
        ALTER TABLE employee_bank_details
        ADD CONSTRAINT valid_bank_temporal_dates
        CHECK (valid_to IS NULL OR valid_from <= valid_to);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_role_temporal_dates'
    ) THEN
        ALTER TABLE employee_role_history
        ADD CONSTRAINT valid_role_temporal_dates
        CHECK (valid_to IS NULL OR valid_from <= valid_to);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_address_temporal
ON employee_address (organization_id, employee_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_employee_address_active
ON employee_address (organization_id, employee_id)
WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_children_temporal
ON employee_children (organization_id, employee_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_employee_children_active
ON employee_children (organization_id, employee_id)
WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_bank_temporal
ON employee_bank_details (organization_id, employee_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_employee_bank_active
ON employee_bank_details (organization_id, employee_id)
WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_role_temporal
ON employee_role_history (organization_id, employee_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_employee_role_active
ON employee_role_history (organization_id, employee_id)
WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_assets_temporal
ON employee_assets (organization_id, employee_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_employee_assets_active
ON employee_assets (organization_id, employee_id)
WHERE valid_to IS NULL;
