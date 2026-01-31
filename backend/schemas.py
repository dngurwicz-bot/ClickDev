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


class EmployeeCreate(BaseModel):
    """DEPRECATED: Model for creating an employee.
    Use Table001Request instead.
    """
    organization_id: str
    id_number: str
    first_name: str
    last_name: str
    first_name_en: Optional[str] = None
    last_name_en: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    employee_number: Optional[str] = None
    hire_date: str
    employment_type: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account: Optional[str] = None


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
