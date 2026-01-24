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
