from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

# Organization Models
class OrganizationCreate(BaseModel):
    name: str
    status: str = "active"

class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Employee Models
class EmployeeCreate(BaseModel):
    organization_id: UUID
    identity_number: Optional[str] = None
    first_name: str
    last_name: str
    job_title: Optional[str] = None
    salary: Optional[float] = None
    department: Optional[str] = None
    is_active: bool = True

class EmployeeUpdate(BaseModel):
    identity_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None
    salary: Optional[float] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class EmployeeResponse(BaseModel):
    id: UUID
    organization_id: UUID
    identity_number: Optional[str]
    first_name: str
    last_name: str
    job_title: Optional[str]
    salary: Optional[float]
    department: Optional[str]
    is_active: bool
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Job History Models
class JobHistoryResponse(BaseModel):
    id: UUID
    employee_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    job_title: Optional[str]
    salary: Optional[float]
    department: Optional[str]
    valid_from: datetime
    valid_to: datetime
    recorded_at: datetime

    class Config:
        from_attributes = True

# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
