"""Module containing Pydantic schemas for the application."""
from typing import List, Optional, Any, Dict
from datetime import datetime, date as date_type
from pydantic import BaseModel

# Pydantic models


class OrganizationCreate(BaseModel):
    """Model for creating an organization."""
    name: str
    name_en: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    active_modules: Optional[List[str]] = ["core"]
    subscription_tier: Optional[str] = "basic"
    admin_email: str
    subscription_tier_id: Optional[str] = None
    logo_url: Optional[str] = None
    org_number: Optional[str] = None


class OrganizationResponse(BaseModel):
    """Model for organization response data."""
    id: str
    name: str
    name_en: Optional[str]
    email: str
    phone: Optional[str]
    logo_url: Optional[str]
    org_number: Optional[str]
    address: Optional[str]
    active_modules: List[str]
    subscription_tier: str
    is_active: bool
    hierarchy_levels: Optional[List[str]]
    config_lock: bool
    created_at: datetime


class OrganizationSetup(BaseModel):
    """Model for configuring organization settings."""
    hierarchy_levels: List[str]
    lock_configuration: bool

# Core Models


class JobGradeCreate(BaseModel):
    """Model for creating a job grade."""
    name: str
    level: int


class JobTitleCreate(BaseModel):
    """Model for creating a job title."""
    title: str
    default_grade_id: Optional[str] = None


class OrgUnitCreate(BaseModel):
    """Model for creating an organizational unit."""
    name: str
    type: str
    parent_id: Optional[str] = None
    manager_id: Optional[str] = None


class PositionCreate(BaseModel):
    """Model for creating a position."""
    org_unit_id: Optional[str] = None
    job_title_id: str
    is_manager_position: bool = False
    occupant_id: Optional[str] = None


class AnnouncementCreate(BaseModel):
    """Model for creating an announcement."""
    title: str
    content: str
    type: Optional[str] = 'info'  # info, warning, success, update
    target_type: Optional[str] = 'all'  # all, specific
    target_organizations: Optional[List[str]] = None
    is_active: Optional[bool] = True


class AnnouncementUpdate(BaseModel):
    """Model for updating an announcement."""
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    target_type: Optional[str] = None
    target_organizations: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    """Model for announcement response data."""
    id: str
    title: str
    content: str
    type: str
    target_type: str
    target_organizations: Optional[List[str]]
    is_active: bool
    created_at: datetime


class Table001Data(BaseModel):
    """Data for Table 001 (Basic Info)."""
    employee_number: str
    id_number: str
    id_type: Optional[str] = 'israeli_id'  # 'israeli_id', 'passport'
    first_name_he: Optional[str] = None
    last_name_he: Optional[str] = None
    father_name_he: Optional[str] = None
    birth_date: Optional[date_type] = None
    effective_from: date_type
    effective_to: Optional[date_type] = None
    page_number: Optional[str] = None


class Table101Data(BaseModel):
    """Data for Table 101 (Address)."""
    cityName: Optional[str] = None
    cityCode: Optional[str] = None
    street: Optional[str] = None
    houseNumber: Optional[str] = None
    apartment: Optional[str] = None
    entrance: Optional[str] = None
    postalCode: Optional[str] = None
    phone: Optional[str] = None
    phoneAdditional: Optional[str] = None
    effectiveFrom: date_type


class Table001Request(BaseModel):
    """Request for manage_table operation (Generalized)."""
    operation_code: str  # 'ADD', 'UPDATE', 'DELETE', 'SET'
    event_code: Optional[str] = "200"
    data: Dict[str, Any]


class EmployeeBase(BaseModel):
    """Base Employee record (Static)."""
    id: str
    organization_id: str
    employee_number: str
    is_active: bool
    created_at: datetime


class UserInvite(BaseModel):
    """Model for inviting a user."""
    email: str
    first_name: str
    last_name: str
    role: str  # 'super_admin', 'org_admin', 'user'
    organization_id: Optional[str] = None


class UserUpdate(BaseModel):
    """Model for updating a user."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    organization_id: Optional[str] = None


class TaskCreate(BaseModel):
    """Model for creating an admin task."""
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    """Model for updating an admin task."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None


class ReportRequest(BaseModel):
    """Model for requesting a generated report."""
    report_type: str  # organizations, employees
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    filters: Optional[Dict[str, Any]] = {}


class BlueprintVersionCreate(BaseModel):
    """Create a new blueprint version."""
    version_key: str
    product_name: str
    language: str = "he-IL"
    direction: str = "rtl"
    positioning: str
    last_updated: date_type


class BlueprintVersionUpdate(BaseModel):
    """Update an existing blueprint version."""
    version_key: Optional[str] = None
    product_name: Optional[str] = None
    language: Optional[str] = None
    direction: Optional[str] = None
    positioning: Optional[str] = None
    last_updated: Optional[date_type] = None


class BlueprintVersionSummary(BaseModel):
    """Public version summary."""
    id: str
    version_key: str
    product_name: str
    is_published: bool
    published_at: Optional[datetime] = None
    last_updated: date_type
    created_at: datetime
    updated_at: datetime


class BlueprintTargetCompanyCreate(BaseModel):
    """Create a target company record."""
    version_id: str
    company_type: str
    sort_order: int


class BlueprintPhaseCreate(BaseModel):
    """Create a blueprint implementation phase."""
    version_id: str
    phase_number: int
    name: str
    duration_weeks: int


class BlueprintPhaseUpdate(BaseModel):
    """Update a blueprint implementation phase."""
    phase_number: Optional[int] = None
    name: Optional[str] = None
    duration_weeks: Optional[int] = None


class BlueprintPhaseDeliverableCreate(BaseModel):
    """Create a phase deliverable row."""
    phase_id: str
    deliverable: str
    sort_order: int


class BlueprintModuleCreate(BaseModel):
    """Create a blueprint module."""
    version_id: str
    module_key: str
    display_order: int
    name: str
    category: str
    for_who: str
    description: str
    is_highlighted: bool = False


class BlueprintModuleUpdate(BaseModel):
    """Update a blueprint module."""
    module_key: Optional[str] = None
    display_order: Optional[int] = None
    name: Optional[str] = None
    category: Optional[str] = None
    for_who: Optional[str] = None
    description: Optional[str] = None
    is_highlighted: Optional[bool] = None


class BlueprintModuleCapabilityCreate(BaseModel):
    """Create a module capability row."""
    module_id: str
    capability: str
    sort_order: int


class BlueprintModuleKpiCreate(BaseModel):
    """Create a module KPI row."""
    module_id: str
    kpi_key: str
    sort_order: int


class BlueprintNotificationChannelCreate(BaseModel):
    """Create a notification channel row."""
    version_id: str
    channel_key: str
    sort_order: int


class BlueprintAlertEngineCreate(BaseModel):
    """Create alert engine row."""
    version_id: str
    name: str
    sort_order: int


class BlueprintAlertEngineUpdate(BaseModel):
    """Update alert engine row."""
    name: Optional[str] = None
    sort_order: Optional[int] = None


class BlueprintAlertExampleCreate(BaseModel):
    """Create an alert example row."""
    engine_id: str
    example_text: str
    sort_order: int


class BlueprintEscalationPolicyCreate(BaseModel):
    """Create an escalation policy row."""
    version_id: str
    policy_key: str
    policy_value: str
    sort_order: int


class BlueprintCoreEntityCreate(BaseModel):
    """Create a core entity row."""
    version_id: str
    entity_name: str
    sort_order: int


class BlueprintIntegrationTargetCreate(BaseModel):
    """Create an integration target row."""
    version_id: str
    target_name: str
    sort_order: int
