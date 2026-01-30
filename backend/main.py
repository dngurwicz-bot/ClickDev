"""
CLICK API Main Module

This module provides the FastAPI backend for the Multi-Tenant HR
Management System.
It acts as the entry point and aggregates the following modules:
- Organizations
- Users
- Core (Job Grades, Titles, Units, Positions)
- Analytics
- Admin
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Add backend directory to Python path to allow imports
sys.path.insert(0, str(Path(__file__).parent))

# Import Routers
from routers import (
    organizations,
    users,
    core,
    analytics,
    admin,
    basic_info
)

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

# Include Routers
app.include_router(organizations.router)
app.include_router(users.router)
app.include_router(core.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(basic_info.router)


# Health check
@app.get("/")
async def root():
    """Root endpoint to check API status."""
    return {"message": "CLICK API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
