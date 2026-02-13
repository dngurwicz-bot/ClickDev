export interface Organization {
    id: string;
    name: string;
    name_en?: string;
    email: string;
    phone?: string;
    logo_url?: string;
    org_number?: string;
    address?: string;
    active_modules: string[];
    subscription_tier: string;
    is_active: boolean;
    hierarchy_levels?: string[]; // e.g. ['Wing', 'Department']
    hierarchy_structure?: Record<string, string | null>;
    use_job_grades: boolean;
    use_job_titles: boolean;
    config_lock: boolean;
    created_at: string;
    updated_at: string;
}

export interface JobGrade {
    id: string;
    organization_id: string;
    name: string;
    level: number;
    created_at: string;
    updated_at: string;
}

export interface JobTitle {
    id: string;
    organization_id: string;
    title: string;
    default_grade_id?: string;
    created_at: string;
    updated_at: string;
}

export interface OrgUnit {
    id: string;
    organization_id: string;
    parent_id?: string;
    unit_number?: string;
    name: string;
    type: string; // Wing, Department
    manager_id?: string;
    children?: OrgUnit[]; // Helper for recursive UI
    created_at: string;
    updated_at: string;
}

export interface Position {
    id: string;
    organization_id: string;
    org_unit_id?: string;
    job_title_id: string;
    is_manager_position: boolean;
    occupant_id?: string;
    valid_from: string; // 'Time Machine' logic often handles this backend-side, but good to have
    created_at: string;
    updated_at: string;
}

export interface HistoryEntry {
    id: string;
    organization_id: string;
    entity_id: string; // org_unit_id or position_id
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    valid_from: string;
    changed_by: string;
    created_at: string;
}

export interface TemporalRecord<T> {
    id: string;
    organization_id: string;
    employee_id: string;
    valid_from: string;
    valid_to: string | null;
    data: T;
}

export interface ClickActionRequest {
    action_key: string;
    effective_at: string;
    payload: Record<string, unknown>;
    request_id: string;
}

export interface EmployeeTimelineItem {
    id: string;
    action_key: string;
    action_version: number;
    effective_at: string;
    payload_json: Record<string, unknown>;
    snapshot_before_json?: Record<string, unknown> | null;
    snapshot_after_json?: Record<string, unknown> | null;
    correlation_id: string;
    created_by?: string | null;
    created_at: string;
}

export interface EmployeeFileResponse {
    employee: Record<string, unknown>;
    addresses: Record<string, unknown>[];
    children: Record<string, unknown>[];
    bank_details: Record<string, unknown>[];
    role_history: Record<string, unknown>[];
    assets: Record<string, unknown>[];
    timeline: EmployeeTimelineItem[];
}

export interface ShortcutItem {
    id: string;
    group_id: string;
    entity_type: string;
    entity_key?: string;
    label: string;
    route: string;
    display_order: number;
    created_at: string;
}

export interface ShortcutGroup {
    id: string;
    user_id: string;
    organization_id: string;
    name: string;
    display_order: number;
    created_at: string;
    shortcuts?: ShortcutItem[];
}

export interface UiHomeConfig {
    widgets_json: Record<string, unknown>;
    shortcut_groups: ShortcutGroup[];
    counters: {
        employees: number;
        org_units: number;
        positions: number;
    };
}

export interface SavedSearch {
    id: string;
    user_id: string;
    organization_id: string;
    screen_key: string;
    name: string;
    filters_json: Record<string, unknown>;
    is_default: boolean;
    last_used_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ActiveScreen {
    id: string;
    user_id: string;
    organization_id: string;
    session_id: string;
    route: string;
    screen_key?: string;
    title?: string;
    last_seen_at: string;
    opened_at: string;
}

export interface SearchMenuResult {
    entity_type: string;
    entity_key: string;
    label: string;
    route: string;
    score: number;
}

export interface OrganizationalSearchResult {
    id: string;
    title: string;
    subtitle: string;
    route: string;
}

export interface ModuleEntitlement {
    module_key: string;
    enabled: boolean;
}

export interface FeatureFlag {
    id?: string;
    organization_id?: string;
    module_key?: string;
    flag_key: string;
    enabled: boolean;
    rollout_percentage?: number;
    config_json?: Record<string, unknown>;
}

export interface WorkflowTask {
    id: string;
    workflow_id: string;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
}

export interface WorkflowState {
    id: string;
    status: string;
    start_date?: string;
    first_day?: string;
    due_date?: string;
}

export interface DocumentTemplate {
    id: string;
    template_key: string;
    title: string;
    body_html: string;
    placeholders: string[] | Record<string, unknown>[];
}

export interface DocumentInstance {
    id: string;
    template_id?: string;
    title: string;
    status: string;
    rendered_html?: string;
    pdf_url?: string;
}

export interface SignatureEnvelope {
    id: string;
    provider: string;
    envelope_id?: string;
    status: string;
    sent_at?: string;
    completed_at?: string;
}

export interface OrgChartNode {
    id: string;
    entity_type: string;
    entity_id?: string;
    label: string;
    metadata?: Record<string, unknown>;
}

export interface OrgChartEdge {
    from: string;
    to: string;
    edge_type: string;
}

export interface OrgGapAlert {
    alert_type: string;
    severity: string;
    title: string;
    details: Record<string, unknown>;
}

export interface AssetItem {
    id: string;
    asset_type: string;
    asset_name: string;
    serial_number?: string;
    status: string;
}

export interface VehicleRecord {
    id: string;
    plate_number: string;
    model?: string;
    assigned_employee_id?: string;
    active: boolean;
}

export interface PulseSurvey {
    id: string;
    title: string;
    status: string;
    questions_json: unknown[];
}

export interface ReviewCycle {
    id: string;
    name: string;
    status: string;
    period_start?: string;
    period_end?: string;
}

export interface Goal {
    id: string;
    title: string;
    status: string;
    progress_pct: number;
    due_date?: string;
}

export interface KpiWidget {
    id: string;
    widget_key: string;
    title: string;
    config_json?: Record<string, unknown>;
}
