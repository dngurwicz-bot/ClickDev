from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import httpx

load_dotenv()

app = FastAPI(
    title="CLICK API",
    description="Multi-Tenant HR Management System Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_anon_key:
    raise ValueError("Missing Supabase environment variables")

supabase: Client = create_client(supabase_url, supabase_anon_key)
supabase_admin: Client = create_client(supabase_url, supabase_service_key)

security = HTTPBearer()

# Helper function to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Helper function to check super admin
async def require_super_admin(user = Depends(get_current_user)):
    response = supabase_admin.table("user_roles").select("*").eq("user_id", user.id).eq("role", "super_admin").execute()
    if not response.data:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

# Pydantic models
class OrganizationCreate(BaseModel):
    name: str
    name_en: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    active_modules: Optional[List[str]] = ["core"]
    subscription_tier: Optional[str] = "basic"
    admin_email: str

class OrganizationResponse(BaseModel):
    id: str
    name: str
    name_en: Optional[str]
    email: str
    phone: Optional[str]
    logo_url: Optional[str]
    address: Optional[str]
    active_modules: List[str]
    subscription_tier: str
    is_active: bool
    created_at: datetime

class EmployeeCreate(BaseModel):
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
    job_title: str
    department: Optional[str] = None
    manager_id: Optional[str] = None
    salary: Optional[float] = None
    salary_currency: Optional[str] = "ILS"
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account: Optional[str] = None

# Health check
@app.get("/")
async def root():
    return {"message": "CLICK API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Organizations endpoints
@app.get("/api/organizations", response_model=List[OrganizationResponse])
async def get_organizations(user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("organizations").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/organizations", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate, user = Depends(require_super_admin)):
    try:
        # Create organization
        org_data = {
            "name": org.name,
            "name_en": org.name_en,
            "email": org.email,
            "phone": org.phone,
            "address": org.address,
            "active_modules": org.active_modules,
            "subscription_tier": org.subscription_tier,
            "created_by": user.id
        }
        
        response = supabase_admin.table("organizations").insert(org_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create organization")
        
        org_id = response.data[0]["id"]
        
        # TODO: Create admin user and assign role
        # This would typically involve:
        # 1. Creating user in auth.users (via Supabase Admin API)
        # 2. Creating user_roles entry
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("organizations").select("*").eq("id", org_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(org_id: str, updates: dict, user = Depends(require_super_admin)):
    try:
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table("organizations").update(updates).eq("id", org_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/organizations/{org_id}")
async def delete_organization(org_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("organizations").delete().eq("id", org_id).execute()
        return {"message": "Organization deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Employees endpoints
@app.get("/api/organizations/{org_id}/employees")
async def get_employees(org_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("employees").select("*").eq("organization_id", org_id).order("first_name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/employees/{employee_id}/history")
async def get_employee_history(employee_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("employee_history").select("*").eq("employee_id", employee_id).order("valid_from", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statistics endpoints
@app.get("/api/stats/dashboard")
async def get_dashboard_stats(user = Depends(require_super_admin)):
    try:
        # Get total organizations
        orgs_response = supabase_admin.table("organizations").select("id", count="exact").execute()
        total_orgs = len(orgs_response.data) if orgs_response.data else 0
        
        # Get active organizations
        active_orgs_response = supabase_admin.table("organizations").select("id", count="exact").eq("is_active", True).execute()
        active_orgs = len(active_orgs_response.data) if active_orgs_response.data else 0
        
        # Get total employees
        employees_response = supabase_admin.table("employees").select("id", count="exact").execute()
        total_employees = len(employees_response.data) if employees_response.data else 0
        
        return {
            "total_organizations": total_orgs,
            "active_organizations": active_orgs,
            "total_employees": total_employees
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
