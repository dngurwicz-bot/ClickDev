"""Admin CRUD for system blueprint."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from database import supabase_admin
from dependencies import require_super_admin
from schemas import (
    BlueprintAlertEngineCreate,
    BlueprintAlertEngineUpdate,
    BlueprintAlertExampleCreate,
    BlueprintCoreEntityCreate,
    BlueprintEscalationPolicyCreate,
    BlueprintIntegrationTargetCreate,
    BlueprintModuleCapabilityCreate,
    BlueprintModuleCreate,
    BlueprintModuleKpiCreate,
    BlueprintModuleUpdate,
    BlueprintNotificationChannelCreate,
    BlueprintPhaseCreate,
    BlueprintPhaseDeliverableCreate,
    BlueprintPhaseUpdate,
    BlueprintTargetCompanyCreate,
    BlueprintVersionCreate,
    BlueprintVersionUpdate,
)

router = APIRouter(prefix="/api/admin/system-blueprint", tags=["System Blueprint Admin"])


def _validate_positive(name: str, value: int, min_value: int = 1):
    if value < min_value:
        raise HTTPException(status_code=400, detail=f"{name} must be >= {min_value}")


def _version_exists(version_id: str):
    rows = supabase_admin.table("system_blueprint_versions") \
        .select("id").eq("id", version_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Blueprint version not found")


def _validate_publishable(version_id: str):
    versions = supabase_admin.table("system_blueprint_versions") \
        .select("id, product_name, positioning, language, direction, version_key") \
        .eq("id", version_id).limit(1).execute().data
    if not versions:
        raise HTTPException(status_code=404, detail="Blueprint version not found")
    version = versions[0]

    required_meta = ["product_name", "positioning", "language", "direction", "version_key"]
    for key in required_meta:
        if not version.get(key):
            raise HTTPException(status_code=400, detail=f"Missing required meta field: {key}")

    modules = supabase_admin.table("system_blueprint_modules") \
        .select("display_order").eq("version_id", version_id) \
        .order("display_order").execute().data
    if not modules:
        raise HTTPException(status_code=400, detail="Cannot publish without modules")
    module_orders = [item["display_order"] for item in modules]
    if module_orders != list(range(1, len(module_orders) + 1)):
        raise HTTPException(status_code=400, detail="Module display_order must be sequential from 1..N")

    phases = supabase_admin.table("system_blueprint_phases") \
        .select("phase_number").eq("version_id", version_id) \
        .order("phase_number").execute().data
    if not phases:
        raise HTTPException(status_code=400, detail="Cannot publish without implementation phases")

    channels = supabase_admin.table("system_blueprint_notification_channels") \
        .select("id").eq("version_id", version_id).limit(1).execute().data
    engines = supabase_admin.table("system_blueprint_alert_engines") \
        .select("id").eq("version_id", version_id).limit(1).execute().data
    escalation = supabase_admin.table("system_blueprint_escalation_policy") \
        .select("id").eq("version_id", version_id).limit(1).execute().data
    if not channels or not engines or not escalation:
        raise HTTPException(status_code=400, detail="Cannot publish without complete smart notifications data")


@router.post("/versions")
async def create_version(payload: BlueprintVersionCreate, _user=Depends(require_super_admin)):
    if payload.direction not in {"rtl", "ltr"}:
        raise HTTPException(status_code=400, detail="direction must be rtl or ltr")
    row = supabase_admin.table("system_blueprint_versions").insert(payload.dict()).execute().data
    return row[0]


@router.get("/versions")
async def list_versions(_user=Depends(require_super_admin)):
    return supabase_admin.table("system_blueprint_versions") \
        .select("*").order("created_at", desc=True).execute().data


@router.put("/versions/{version_id}")
async def update_version(version_id: str, payload: BlueprintVersionUpdate, _user=Depends(require_super_admin)):
    _version_exists(version_id)
    data = payload.dict(exclude_unset=True)
    if "direction" in data and data["direction"] not in {"rtl", "ltr"}:
        raise HTTPException(status_code=400, detail="direction must be rtl or ltr")
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    data["updated_at"] = datetime.utcnow().isoformat()
    row = supabase_admin.table("system_blueprint_versions") \
        .update(data).eq("id", version_id).execute().data
    return row[0]


@router.post("/versions/{version_id}/publish")
async def publish_version(version_id: str, _user=Depends(require_super_admin)):
    _validate_publishable(version_id)
    supabase_admin.table("system_blueprint_versions").update(
        {"is_published": False}
    ).eq("is_published", True).execute()
    row = supabase_admin.table("system_blueprint_versions").update(
        {
            "is_published": True,
            "published_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ).eq("id", version_id).execute().data
    return row[0]


@router.post("/target-companies")
async def create_target_company(payload: BlueprintTargetCompanyCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_target_companies").insert(payload.dict()).execute().data[0]


@router.delete("/target-companies/{target_company_id}")
async def delete_target_company(target_company_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_target_companies").delete().eq("id", target_company_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/phases")
async def create_phase(payload: BlueprintPhaseCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("phase_number", payload.phase_number)
    _validate_positive("duration_weeks", payload.duration_weeks)
    return supabase_admin.table("system_blueprint_phases").insert(payload.dict()).execute().data[0]


@router.put("/phases/{phase_id}")
async def update_phase(phase_id: str, payload: BlueprintPhaseUpdate, _user=Depends(require_super_admin)):
    data = payload.dict(exclude_unset=True)
    if "phase_number" in data:
        _validate_positive("phase_number", data["phase_number"])
    if "duration_weeks" in data:
        _validate_positive("duration_weeks", data["duration_weeks"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    data["updated_at"] = datetime.utcnow().isoformat()
    row = supabase_admin.table("system_blueprint_phases").update(data).eq("id", phase_id).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Phase not found")
    return row[0]


@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_phases").delete().eq("id", phase_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/phase-deliverables")
async def create_phase_deliverable(payload: BlueprintPhaseDeliverableCreate, _user=Depends(require_super_admin)):
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_phase_deliverables").insert(payload.dict()).execute().data[0]


@router.delete("/phase-deliverables/{deliverable_id}")
async def delete_phase_deliverable(deliverable_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_phase_deliverables").delete().eq("id", deliverable_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/modules")
async def create_module(payload: BlueprintModuleCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("display_order", payload.display_order)
    return supabase_admin.table("system_blueprint_modules").insert(payload.dict()).execute().data[0]


@router.put("/modules/{module_id}")
async def update_module(module_id: str, payload: BlueprintModuleUpdate, _user=Depends(require_super_admin)):
    data = payload.dict(exclude_unset=True)
    if "display_order" in data:
        _validate_positive("display_order", data["display_order"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    data["updated_at"] = datetime.utcnow().isoformat()
    row = supabase_admin.table("system_blueprint_modules").update(data).eq("id", module_id).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Module not found")
    return row[0]


@router.delete("/modules/{module_id}")
async def delete_module(module_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_modules").delete().eq("id", module_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/module-capabilities")
async def create_module_capability(payload: BlueprintModuleCapabilityCreate, _user=Depends(require_super_admin)):
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_module_capabilities").insert(payload.dict()).execute().data[0]


@router.delete("/module-capabilities/{capability_id}")
async def delete_module_capability(capability_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_module_capabilities").delete().eq("id", capability_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/module-kpis")
async def create_module_kpi(payload: BlueprintModuleKpiCreate, _user=Depends(require_super_admin)):
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_module_kpis").insert(payload.dict()).execute().data[0]


@router.delete("/module-kpis/{kpi_id}")
async def delete_module_kpi(kpi_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_module_kpis").delete().eq("id", kpi_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/notification-channels")
async def create_channel(payload: BlueprintNotificationChannelCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_notification_channels").insert(payload.dict()).execute().data[0]


@router.delete("/notification-channels/{channel_id}")
async def delete_channel(channel_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_notification_channels").delete().eq("id", channel_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/alert-engines")
async def create_alert_engine(payload: BlueprintAlertEngineCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_alert_engines").insert(payload.dict()).execute().data[0]


@router.put("/alert-engines/{engine_id}")
async def update_alert_engine(engine_id: str, payload: BlueprintAlertEngineUpdate, _user=Depends(require_super_admin)):
    data = payload.dict(exclude_unset=True)
    if "sort_order" in data:
        _validate_positive("sort_order", data["sort_order"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    data["updated_at"] = datetime.utcnow().isoformat()
    row = supabase_admin.table("system_blueprint_alert_engines").update(data).eq("id", engine_id).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Alert engine not found")
    return row[0]


@router.delete("/alert-engines/{engine_id}")
async def delete_alert_engine(engine_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_alert_engines").delete().eq("id", engine_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/alert-examples")
async def create_alert_example(payload: BlueprintAlertExampleCreate, _user=Depends(require_super_admin)):
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_alert_examples").insert(payload.dict()).execute().data[0]


@router.delete("/alert-examples/{example_id}")
async def delete_alert_example(example_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_alert_examples").delete().eq("id", example_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/escalation-policies")
async def create_escalation_policy(payload: BlueprintEscalationPolicyCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_escalation_policy").insert(payload.dict()).execute().data[0]


@router.delete("/escalation-policies/{policy_id}")
async def delete_escalation_policy(policy_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_escalation_policy").delete().eq("id", policy_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/core-entities")
async def create_core_entity(payload: BlueprintCoreEntityCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_core_entities").insert(payload.dict()).execute().data[0]


@router.delete("/core-entities/{entity_id}")
async def delete_core_entity(entity_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_core_entities").delete().eq("id", entity_id).execute()
    return {"message": "Deleted successfully"}


@router.post("/integration-targets")
async def create_integration_target(payload: BlueprintIntegrationTargetCreate, _user=Depends(require_super_admin)):
    _version_exists(payload.version_id)
    _validate_positive("sort_order", payload.sort_order)
    return supabase_admin.table("system_blueprint_integration_targets").insert(payload.dict()).execute().data[0]


@router.delete("/integration-targets/{target_id}")
async def delete_integration_target(target_id: str, _user=Depends(require_super_admin)):
    supabase_admin.table("system_blueprint_integration_targets").delete().eq("id", target_id).execute()
    return {"message": "Deleted successfully"}


@router.get("/versions/{version_id}/full")
async def get_full_version(version_id: str, _user=Depends(require_super_admin)):
    """Return all editable records for one version."""
    _version_exists(version_id)
    data = {
        "version": supabase_admin.table("system_blueprint_versions").select("*").eq("id", version_id).single().execute().data,
        "target_companies": supabase_admin.table("system_blueprint_target_companies").select("*").eq("version_id", version_id).order("sort_order").execute().data,
        "phases": supabase_admin.table("system_blueprint_phases").select("*").eq("version_id", version_id).order("phase_number").execute().data,
        "modules": supabase_admin.table("system_blueprint_modules").select("*").eq("version_id", version_id).order("display_order").execute().data,
        "channels": supabase_admin.table("system_blueprint_notification_channels").select("*").eq("version_id", version_id).order("sort_order").execute().data,
        "engines": supabase_admin.table("system_blueprint_alert_engines").select("*").eq("version_id", version_id).order("sort_order").execute().data,
        "escalation": supabase_admin.table("system_blueprint_escalation_policy").select("*").eq("version_id", version_id).order("sort_order").execute().data,
        "core_entities": supabase_admin.table("system_blueprint_core_entities").select("*").eq("version_id", version_id).order("sort_order").execute().data,
        "integration_targets": supabase_admin.table("system_blueprint_integration_targets").select("*").eq("version_id", version_id).order("sort_order").execute().data,
    }

    phase_ids = [p["id"] for p in data["phases"]]
    module_ids = [m["id"] for m in data["modules"]]
    engine_ids = [e["id"] for e in data["engines"]]

    data["phase_deliverables"] = []
    data["module_capabilities"] = []
    data["module_kpis"] = []
    data["engine_examples"] = []

    if phase_ids:
        data["phase_deliverables"] = supabase_admin.table("system_blueprint_phase_deliverables") \
            .select("*").in_("phase_id", phase_ids).order("sort_order").execute().data
    if module_ids:
        data["module_capabilities"] = supabase_admin.table("system_blueprint_module_capabilities") \
            .select("*").in_("module_id", module_ids).order("sort_order").execute().data
        data["module_kpis"] = supabase_admin.table("system_blueprint_module_kpis") \
            .select("*").in_("module_id", module_ids).order("sort_order").execute().data
    if engine_ids:
        data["engine_examples"] = supabase_admin.table("system_blueprint_alert_examples") \
            .select("*").in_("engine_id", engine_ids).order("sort_order").execute().data

    return data
