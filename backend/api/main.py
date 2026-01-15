from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import employees, organizations, auth, job_history

app = FastAPI(
    title="CLICK HR Platform API",
    description="SaaS HR Platform Backend",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(job_history.router, prefix="/api/job-history", tags=["job-history"])

@app.get("/")
async def root():
    return {"message": "CLICK HR Platform API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
