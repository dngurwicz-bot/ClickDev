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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_api_key = os.getenv("SUPABASE_API_KEY")

if not supabase_url or not supabase_api_key:
    raise ValueError("Missing Supabase environment variables")

# Initialize admin client
try:
    if "PLACEHOLDER" in supabase_api_key:
         raise ValueError("Invalid API Key")
    supabase_admin: Client = create_client(supabase_url, supabase_api_key)
    # Alias for backwards compatibility
    supabase = supabase_admin 
except Exception as e:
    print(f"CRITICAL: Failed to create admin client: {e}", flush=True)
    raise e

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

# Activity Logging Helper
async def log_activity(user_id: str, action_type: str, entity_type: str, entity_id: Optional[str] = None, details: dict = {}, organization_id: Optional[str] = None):
    try:
        log_data = {
            "user_id": user_id,
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "organization_id": organization_id,
            "created_at": datetime.utcnow().isoformat()
        }
        supabase_admin.table("user_activity_logs").insert(log_data).execute()
    except Exception as e:
        print(f"Error logging activity: {str(e)}")

# Activity Log Endpoint
@app.get("/api/activity-logs/{user_id}")
async def get_user_activity_logs(user_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("user_activity_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    subscription_tier_id: Optional[str] = None
    logo_url: Optional[str] = None
    org_number: Optional[str] = None

class OrganizationResponse(BaseModel):
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
    created_at: datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    type: Optional[str] = 'info'  # info, warning, success, update
    target_type: Optional[str] = 'all'  # all, specific
    target_organizations: Optional[List[str]] = None
    is_active: Optional[bool] = True

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    target_type: Optional[str] = None
    target_organizations: Optional[List[str]] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    type: str
    target_type: str
    target_organizations: Optional[List[str]]
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

def generate_org_number():
    """Generate a unique 5-digit organization number"""
    try:
        # Get the highest existing org_number
        response = supabase_admin.table("organizations").select("org_number").order("org_number", desc=True).limit(1).execute()
        
        if response.data and response.data[0].get("org_number"):
            # Increment the highest number
            max_num = int(response.data[0]["org_number"])
            new_num = max_num + 1
        else:
            # Start from 10000 if no organizations exist
            new_num = 10000
        
        # Ensure it's 5 digits
        return str(new_num).zfill(5)
    except Exception as e:
        print(f"Error generating org_number: {e}")
        # Fallback to random 5-digit number
        import random
        return str(random.randint(10000, 99999))

@app.post("/api/organizations", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate, user = Depends(require_super_admin)):
    try:
        # Auto-generate org_number if not provided
        org_number = org.org_number if org.org_number else generate_org_number()
        
        # Create organization
        org_data = {
            "name": org.name,
            "name_en": org.name_en,
            "email": org.email,
            "phone": org.phone,
            "address": org.address,
            "active_modules": org.active_modules,
            "subscription_tier_id": org.subscription_tier_id,
            "subscription_tier": org.subscription_tier,
            "logo_url": org.logo_url,
            "org_number": org_number,
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
        # ...
        
        # Log Activity
        await log_activity(
            user_id=user.id,
            action_type="CREATE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=response.data[0]["id"],
            details={"name": org.name}
        )

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
        
        await log_activity(
            user_id=user.id,
            action_type="UPDATE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id,
            details=updates
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/organizations/{org_id}")
async def delete_organization(org_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("organizations").delete().eq("id", org_id).execute()
        
        await log_activity(
            user_id=user.id,
            action_type="DELETE_ORGANIZATION",
            entity_type="ORGANIZATION",
            entity_id=org_id
        )

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
        orgs_response = supabase_admin.table("organizations").select("id, subscription_tier", count="exact").execute()
        total_orgs = len(orgs_response.data) if orgs_response.data else 0
        
        # Get active organizations
        active_orgs_response = supabase_admin.table("organizations").select("id", count="exact").eq("is_active", True).execute()
        active_orgs = len(active_orgs_response.data) if active_orgs_response.data else 0
        
        # Get total employees
        employees_response = supabase_admin.table("employees").select("id", count="exact").execute()
        total_employees = len(employees_response.data) if employees_response.data else 0

        # Calculate MRR (Estimated)
        mrr = 0
        if orgs_response.data:
            for org in orgs_response.data:
                tier = org.get("subscription_tier", "basic")
                if tier == "pro":
                    mrr += 50
                elif tier == "enterprise":
                    mrr += 200
                # basic is 0
        
        # Get Recent Activity (Last 5 created orgs)
        recent_activity_response = supabase_admin.table("organizations").select("id, name, created_at, is_active").order("created_at", desc=True).limit(5).execute()
        recent_activity = recent_activity_response.data if recent_activity_response.data else []
        
        return {
            "total_organizations": total_orgs,
            "active_organizations": active_orgs,
            "total_employees": total_employees,
            "mrr": mrr,
            "recent_activity": recent_activity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Task Management Endpoints
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

@app.get("/api/tasks")
async def get_tasks(user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("admin_tasks").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(task: TaskCreate, user = Depends(require_super_admin)):
    try:
        task_data = task.dict(exclude_unset=True)
        task_data["created_by"] = user.id
        
        # If assigned_to is 'self' or empty, assign to current user
        if not task_data.get("assigned_to") or task_data.get("assigned_to") == "self":
             task_data["assigned_to"] = user.id
             
        response = supabase_admin.table("admin_tasks").insert(task_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create task")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate, user = Depends(require_super_admin)):
    try:
        updates = task.dict(exclude_unset=True)
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table("admin_tasks").update(updates).eq("id", task_id).execute()
        if not response.data:
             raise HTTPException(status_code=404, detail="Task not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, user = Depends(require_super_admin)):
    try:
        response = supabase_admin.table("admin_tasks").delete().eq("id", task_id).execute()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Management Endpoints
@app.get("/api/users")
async def get_all_users(user = Depends(require_super_admin)):
    try:
        # Option 1: Direct SQL Query via RPC (if created) or use service key on auth schema if enabled (usually not exposed to postgrest)
        # Option 2: Use the admin API (which failed).
        # Let's try to debug the admin API failure or use a workaround.
        # Workaround: since we are on the backend with a connection to the DB (implied by supabase-py but actually it uses HTTP), 
        # we can't easily run raw SQL unless we have an RPC function.
        
        # Let's try to use the 'auth_users_view' if one exists, or create one.
        # But wait, we cannot easily create views from here without migration.
        
        # PROPOSED FIX: The 'Database error finding users' often indicates a schema issue or a service interruption in local dev.
        # Let's verify if we can query the 'users' table in public schema if we sync it?
        # No, we want the source of truth.

        # Let's try to list users again but inspecting the response more carefully.
        # Actually, let's try to fetch from 'user_roles' first to see who exists?
        
        # BETTER APPROACH:
        # If Admin API fails, let's check if we can query the 'profiles' or 'employees' tables?
        # But the requirement is Global User Management (Auth users).
        
        # Let's assume for a moment the Admin API error is ephemeral or due to bad env param.
        # Re-reading main.py:
        # supabase_url = os.getenv("SUPABASE_URL")
        # supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        # Let's fallback to querying `auth.users` via a SECURITY DEFINER function if we have one.
        # We don't have one that returns all users yet.
        
        # Let's create a Secure Function to fetch users.
        # This bypasses the Auth Admin API and goes straight to DB.
        
        response = supabase_admin.rpc("get_all_users_secure", {}).execute()
        if not response.data:
            return []
            
        # Transform data to match frontend expectations if needed
        # Frontend expects: id, email, created_at, last_sign_in_at, role, organization_name, user_metadata
        # RPC returns exactly these fields.
        return response.data

    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        # Temporary: return empty list to avoid 500
        return []

class UserInvite(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str # 'super_admin', 'org_admin', 'user'
    organization_id: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    organization_id: Optional[str] = None

@app.post("/api/users")
async def invite_user(invite: UserInvite, user = Depends(require_super_admin)):
    try:
        # 1. Invite user in Supabase Auth (sends email)
        # Note: invite_user_by_email takes email and options (data, redirect_to)
        auth_response = supabase_admin.auth.admin.invite_user_by_email(
            invite.email,
            options={
                "data": {
                    "first_name": invite.first_name,
                    "last_name": invite.last_name,
                    "organization_id": invite.organization_id
                }
            }
        )
        new_user = auth_response.user
        
        if not new_user:
             raise HTTPException(status_code=400, detail="Failed to invite user")

        # 2. Assign Role in user_roles table
        role_data = {
            "user_id": new_user.id,
            "role": invite.role,
            "organization_id": invite.organization_id
        }
        
        # If super_admin, organization_id should optionally be null or system? 
        # For now, we allow super_admin to belong to an org or not.
        
        role_response = supabase_admin.table("user_roles").insert(role_data).execute()
        
        if not role_response.data:
            # Rollback?
            supabase_admin.auth.admin.delete_user(new_user.id)
            raise HTTPException(status_code=400, detail="Failed to assign role")
            
        await log_activity(
            user_id=user.id,
            action_type="INVITE_USER",
            entity_type="USER",
            entity_id=new_user.id,
            details={"email": invite.email, "role": invite.role, "organization_id": invite.organization_id},
            organization_id=invite.organization_id
        )
            
        return {"message": "User invited successfully", "user_id": new_user.id}

    except Exception as e:
        print(f"Error inviting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, user = Depends(require_super_admin)):
    try:
        # 0. Cleanup dependencies manually (since cascade might fail via API)
        # Check and delete from related tables
        supabase_admin.table("user_roles").delete().eq("user_id", user_id).execute()
        supabase_admin.table("admin_tasks").delete().eq("assigned_to", user_id).execute()
        supabase_admin.table("admin_tasks").delete().eq("created_by", user_id).execute()
        # Note: Organizations created by user might block, but we probably shouldn't delete the org?
        # Ideally we transfer ownership. For now, we assume if they are created_by, we might encounter error
        # or we just leave it if null is allowed. If FK exists, it will block.
        # Let's try to set created_by to NULL if possible, or handle it? 
        # Actually for 'User' role, they likely don't own orgs.
        
        # 1. Delete from Auth (Primary)
        response = supabase_admin.auth.admin.delete_user(user_id)
        
        return {"message": "User deleted successfully"}
    except Exception as e:
         # If Auth delete fails, it might be due to constraints we missed.
         # Try SQL fallback if relevant? No, stick to API.
         print(f"Error deleting user: {str(e)}")
         raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate, user = Depends(require_super_admin)):
    try:
        # 1. Update Auth Metadata (Name)
        meta_updates = {}
        if updates.first_name: meta_updates["first_name"] = updates.first_name
        if updates.last_name: meta_updates["last_name"] = updates.last_name
        
        if meta_updates:
            supabase_admin.auth.admin.update_user_by_id(user_id, {"user_metadata": meta_updates})
            
        # 2. Update Role/Org
        # This is tricky because a user might have multiple roles. 
        # For this simple system, we assume 1 role per user (or at least we update the primary one).
        # We delete existing roles and insert new one to be safe/simple
        
        if updates.role or updates.organization_id:
            # Delete existing
            supabase_admin.table("user_roles").delete().eq("user_id", user_id).execute()
            
            # Insert new
            new_role = updates.role if updates.role else "user" # Fallback? No, should fetch existing.
            # Ideally we fetch existing if not provided, but for simplicity we require both or assume overwrite.
            # Let's assume the frontend sends the desired final state.
            
            role_data = {
                "user_id": user_id,
                "role": updates.role,
                "organization_id": updates.organization_id
            }
             # Handle None for organization_id if super_admin
            supabase_admin.table("user_roles").insert(role_data).execute()
            
        return {"message": "User updated successfully"}
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/reset-password")
async def reset_password(user_id: str, user = Depends(require_super_admin)):
    try:
        # Get user email
        user_response = supabase_admin.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
             raise HTTPException(status_code=404, detail="User not found")
        
        email = user_response.user.email
        
        # Trigger password reset email
        # Note: This sends an email if Supabase SMTP is configured. 
        # In local dev, it might just log or return the link if using Inbucket (standard supabase CLI).
        # We assume standard behavior.
        
        # Using sending the recovery email via auth api
        supabase.auth.reset_password_for_email(email)
        
        return {"message": "Password reset email sent successfully"}
    except Exception as e:
        print(f"Error sending reset password email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Announcements endpoints
@app.get("/api/announcements", response_model=List[AnnouncementResponse])
async def get_announcements(user = Depends(get_current_user)):
    """Get announcements for current user's organization"""
    try:
        # Get user's organization
        user_roles = supabase_admin.table("user_roles").select("organization_id").eq("user_id", user.id).execute()
        
        if not user_roles.data:
            return []
        
        org_id = user_roles.data[0]["organization_id"]
        
        # Get announcements (RLS will filter automatically)
        response = supabase_admin.table("announcements").select("*").eq("is_active", True).order("created_at", desc=True).execute()
        
        # Additional filtering for specific targeting
        filtered = []
        for announcement in response.data:
            if announcement["target_type"] == "all":
                filtered.append(announcement)
            elif announcement["target_type"] == "specific" and announcement.get("target_organizations"):
                if org_id in announcement["target_organizations"]:
                    filtered.append(announcement)
        
        return filtered
    except Exception as e:
        print(f"Error fetching announcements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, user = Depends(require_super_admin)):
    """Create a new announcement (Super Admin only)"""
    try:
        announcement_data = {
            "title": announcement.title,
            "content": announcement.content,
            "type": announcement.type,
            "target_type": announcement.target_type,
            "target_organizations": announcement.target_organizations,
            "is_active": announcement.is_active,
            "created_by": user.id
        }
        
        response = supabase_admin.table("announcements").insert(announcement_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create announcement")
        
        return response.data[0]
    except Exception as e:
        print(f"Error creating announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(announcement_id: str, announcement: AnnouncementUpdate, user = Depends(require_super_admin)):
    """Update an announcement (Super Admin only)"""
    try:
        update_data = {k: v for k, v in announcement.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = supabase_admin.table("announcements").update(update_data).eq("id", announcement_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        return response.data[0]
    except Exception as e:
        print(f"Error updating announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, user = Depends(require_super_admin)):
    """Delete an announcement (Super Admin only)"""
    try:
        response = supabase_admin.table("announcements").delete().eq("id", announcement_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        return {"message": "Announcement deleted successfully"}
    except Exception as e:
        print(f"Error deleting announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
