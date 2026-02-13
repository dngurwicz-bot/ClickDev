from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin_orgs, me, org

app = FastAPI(title="HR SaaS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"ok": True}


app.include_router(me.router)
app.include_router(admin_orgs.router)
app.include_router(org.router)
