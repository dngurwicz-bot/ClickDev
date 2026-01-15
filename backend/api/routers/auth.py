from fastapi import APIRouter, HTTPException, Depends
from api.models import LoginRequest, TokenResponse
from api.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, supabase: Client = Depends(get_supabase_client)):
    """Login endpoint"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase_client)):
    """Logout endpoint"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Logout failed: {str(e)}")
