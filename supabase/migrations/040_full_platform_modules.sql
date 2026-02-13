-- 040_full_platform_modules.sql
-- Full modular platform foundation for CLICK (Flow/Docs/Vision/Assets/Vibe/Grow/Insights + runtime + notifications)

-- -----------------------------
-- Platform Runtime
-- -----------------------------
CREATE TABLE IF NOT EXISTS module_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_core BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_module_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, module_key)
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    module_key TEXT,
    flag_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER NOT NULL DEFAULT 100,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, module_key, flag_key)
);

CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    module_key TEXT,
    channel TEXT NOT NULL,
    template_key TEXT,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    target TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    module_key TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_json JSONB,
    after_json JSONB,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Flow
-- -----------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    stage TEXT NOT NULL DEFAULT 'new',
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    start_date DATE,
    first_day DATE,
    due_date DATE,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES onboarding_workflows(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date DATE,
    escalation_date DATE,
    completed_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_forms_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES onboarding_workflows(id) ON DELETE SET NULL,
    form_type TEXT NOT NULL,
    subject_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'submitted',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employment_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES onboarding_workflows(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    template_id UUID,
    status TEXT NOT NULL DEFAULT 'draft',
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'docusign',
    envelope_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    signed_at TIMESTAMPTZ,
    callback_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Docs
-- -----------------------------
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_key TEXT NOT NULL,
    title TEXT NOT NULL,
    body_html TEXT NOT NULL,
    placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, template_key)
);

CREATE TABLE IF NOT EXISTS document_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    subject_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    title TEXT NOT NULL,
    merged_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    rendered_html TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_instance_id UUID NOT NULL REFERENCES document_instances(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    rendered_html TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_instance_id, version_no)
);

CREATE TABLE IF NOT EXISTS signature_envelopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_instance_id UUID REFERENCES document_instances(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'docusign',
    envelope_id TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    callback_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Vision
-- -----------------------------
CREATE TABLE IF NOT EXISTS org_chart_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_name TEXT NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_chart_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES org_chart_snapshots(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    label TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_chart_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES org_chart_snapshots(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES org_chart_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES org_chart_nodes(id) ON DELETE CASCADE,
    edge_type TEXT NOT NULL DEFAULT 'reports_to',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_chart_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES org_chart_snapshots(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- -----------------------------
-- Assets
-- -----------------------------
CREATE TABLE IF NOT EXISTS asset_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'in_stock',
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES asset_catalog(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    return_due_date DATE,
    returned_at DATE,
    status TEXT NOT NULL DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL,
    model TEXT,
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, plate_number)
);

CREATE TABLE IF NOT EXISTS vehicle_insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicle_records(id) ON DELETE CASCADE,
    provider_name TEXT,
    policy_number TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_test_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicle_records(id) ON DELETE CASCADE,
    test_due_date DATE NOT NULL,
    completed_at DATE,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Vibe
-- -----------------------------
CREATE TABLE IF NOT EXISTS employee_portal_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holiday_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    holiday_name TEXT NOT NULL,
    gift_description TEXT,
    distributed_at DATE,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    opens_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES pulse_surveys(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Grow
-- -----------------------------
CREATE TABLE IF NOT EXISTS review_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    review_cycle_id UUID REFERENCES review_cycles(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    score NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'open',
    progress_pct INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    coach_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    summary TEXT,
    next_steps TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Insights
-- -----------------------------
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_key TEXT,
    kpi_key TEXT NOT NULL,
    title TEXT NOT NULL,
    query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, kpi_key)
);

CREATE TABLE IF NOT EXISTS kpi_materializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    bucket_date DATE NOT NULL,
    value_numeric NUMERIC(14,4),
    value_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(kpi_definition_id, bucket_date)
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    widget_key TEXT NOT NULL,
    title TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, widget_key)
);

CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_key TEXT NOT NULL,
    title TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, report_key)
);

CREATE TABLE IF NOT EXISTS report_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued',
    output_url TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------
-- Indexes
-- -----------------------------
CREATE INDEX IF NOT EXISTS idx_org_module_flags_org ON org_module_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_org ON feature_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_org_status ON notification_events(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_events_scheduled ON notification_events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_event ON notification_deliveries(notification_event_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_org_created ON audit_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_org_stage ON candidates(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_org_status ON onboarding_workflows(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_workflow_status ON onboarding_tasks(workflow_id, status);

CREATE INDEX IF NOT EXISTS idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_org_status ON document_instances(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_chart_nodes_org ON org_chart_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_catalog_org_status ON asset_catalog(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_records_org_active ON vehicle_records(organization_id, active);

CREATE INDEX IF NOT EXISTS idx_pulse_surveys_org_status ON pulse_surveys(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_review_cycles_org_status ON review_cycles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_org_status ON goals(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_kpi_materializations_def_date ON kpi_materializations(kpi_definition_id, bucket_date DESC);
CREATE INDEX IF NOT EXISTS idx_report_runs_definition_status ON report_runs(report_definition_id, status);

-- -----------------------------
-- Updated_at triggers
-- -----------------------------
CREATE OR REPLACE FUNCTION touch_updated_at_generic() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'module_registry','org_module_flags','feature_flags','notification_events','notification_deliveries',
    'candidates','onboarding_workflows','onboarding_tasks','digital_forms_submissions','employment_contracts','contract_signatures',
    'document_templates','document_instances','signature_envelopes',
    'asset_catalog','asset_assignments','vehicle_records','vehicle_insurance_policies','vehicle_test_schedule',
    'employee_portal_posts','company_events','holiday_gifts','pulse_surveys',
    'review_cycles','performance_reviews','goals','coaching_sessions',
    'kpi_definitions','dashboard_widgets','report_definitions','report_runs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at_generic()', t, t);
  END LOOP;
END $$;

-- -----------------------------
-- RLS policies
-- -----------------------------
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'module_registry','org_module_flags','feature_flags','notification_events','notification_deliveries','audit_events',
    'candidates','onboarding_workflows','onboarding_tasks','digital_forms_submissions','employment_contracts','contract_signatures',
    'document_templates','document_instances','document_versions','signature_envelopes',
    'org_chart_snapshots','org_chart_nodes','org_chart_edges','org_chart_alerts',
    'asset_catalog','asset_assignments','vehicle_records','vehicle_insurance_policies','vehicle_test_schedule',
    'employee_portal_posts','company_events','holiday_gifts','pulse_surveys','pulse_responses',
    'review_cycles','performance_reviews','goals','goal_checkins','coaching_sessions',
    'kpi_definitions','kpi_materializations','dashboard_widgets','report_definitions','report_runs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- module_registry is global read
DROP POLICY IF EXISTS "module_registry_read_all" ON module_registry;
CREATE POLICY "module_registry_read_all" ON module_registry
FOR SELECT USING (TRUE);

-- org scoped templates
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT unnest(ARRAY[
    'org_module_flags','feature_flags','notification_events','audit_events',
    'candidates','onboarding_workflows','onboarding_tasks','digital_forms_submissions','employment_contracts','contract_signatures',
    'document_templates','document_instances','signature_envelopes',
    'org_chart_snapshots','org_chart_nodes','org_chart_edges','org_chart_alerts',
    'asset_catalog','asset_assignments','vehicle_records','vehicle_insurance_policies','vehicle_test_schedule',
    'employee_portal_posts','company_events','holiday_gifts','pulse_surveys','pulse_responses',
    'review_cycles','performance_reviews','goals','goal_checkins','coaching_sessions',
    'kpi_definitions','kpi_materializations','dashboard_widgets','report_definitions','report_runs'
  ]) AS tname LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_org_read" ON %I', p.tname, p.tname);
    EXECUTE format('CREATE POLICY "%I_org_read" ON %I FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))', p.tname, p.tname);
    EXECUTE format('DROP POLICY IF EXISTS "%I_org_write" ON %I', p.tname, p.tname);
    EXECUTE format('CREATE POLICY "%I_org_write" ON %I FOR ALL USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN (''super_admin'',''organization_admin'')))', p.tname, p.tname);
  END LOOP;
END $$;

-- tables without direct organization_id
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_versions_org_read" ON document_versions;
CREATE POLICY "document_versions_org_read" ON document_versions
FOR SELECT USING (
  document_instance_id IN (
    SELECT id FROM document_instances WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "document_versions_org_write" ON document_versions;
CREATE POLICY "document_versions_org_write" ON document_versions
FOR ALL USING (
  document_instance_id IN (
    SELECT id FROM document_instances WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','organization_admin')
    )
  )
);

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_deliveries_org_read" ON notification_deliveries;
CREATE POLICY "notification_deliveries_org_read" ON notification_deliveries
FOR SELECT USING (
  notification_event_id IN (
    SELECT id FROM notification_events WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "notification_deliveries_org_write" ON notification_deliveries;
CREATE POLICY "notification_deliveries_org_write" ON notification_deliveries
FOR ALL USING (
  notification_event_id IN (
    SELECT id FROM notification_events WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','organization_admin')
    )
  )
);

ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goal_checkins_org_read" ON goal_checkins;
CREATE POLICY "goal_checkins_org_read" ON goal_checkins
FOR SELECT USING (
  goal_id IN (
    SELECT id FROM goals WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "goal_checkins_org_write" ON goal_checkins;
CREATE POLICY "goal_checkins_org_write" ON goal_checkins
FOR ALL USING (
  goal_id IN (
    SELECT id FROM goals WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','organization_admin')
    )
  )
);

-- Seed module registry
INSERT INTO module_registry (module_key, name, description, is_core)
VALUES
  ('core', 'CLICK Core', 'Core HR lifecycle and org structure', TRUE),
  ('flow', 'CLICK Flow', 'Onboarding and recruitment workflows', FALSE),
  ('docs', 'CLICK Docs', 'Document generation and signature', FALSE),
  ('vision', 'CLICK Vision', 'Org chart visualization and gap analysis', FALSE),
  ('assets', 'CLICK Assets', 'Asset and fleet lifecycle management', FALSE),
  ('vibe', 'CLICK Vibe', 'Employee portal and engagement', FALSE),
  ('grow', 'CLICK Grow', 'Performance and development', FALSE),
  ('insights', 'CLICK Insights', 'BI and analytics', FALSE)
ON CONFLICT (module_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_core = EXCLUDED.is_core,
    updated_at = NOW();
