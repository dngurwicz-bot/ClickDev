"""System blueprint public API backed by Supabase tables."""

from collections import defaultdict
from fastapi import APIRouter, HTTPException

from database import supabase_admin

router = APIRouter(prefix="/api/system-blueprint", tags=["System Blueprint"])


def _fetch_single(table: str, query: str, field: str, value):
    """Execute a select query and filter by a single field."""
    return supabase_admin.table(table).select(query).eq(field, value).execute().data


def build_blueprint_payload(version_id: str):
    """Build full blueprint payload for one version."""
    versions = _fetch_single("system_blueprint_versions", "*", "id", version_id)
    if not versions:
        raise HTTPException(status_code=404, detail="Blueprint version not found")

    version = versions[0]

    target_companies = _fetch_single(
        "system_blueprint_target_companies",
        "company_type, sort_order",
        "version_id",
        version_id
    )
    target_companies = [x["company_type"] for x in sorted(target_companies, key=lambda x: x["sort_order"])]

    phases = _fetch_single(
        "system_blueprint_phases",
        "id, phase_number, name, duration_weeks",
        "version_id",
        version_id
    )
    phases = sorted(phases, key=lambda x: x["phase_number"])
    phase_ids = [phase["id"] for phase in phases]
    phase_deliverables = []
    if phase_ids:
        phase_deliverables = supabase_admin.table("system_blueprint_phase_deliverables") \
            .select("phase_id, deliverable, sort_order") \
            .in_("phase_id", phase_ids).execute().data
    deliverables_by_phase = defaultdict(list)
    for row in phase_deliverables:
        deliverables_by_phase[row["phase_id"]].append(row)
    for phase_id in deliverables_by_phase:
        deliverables_by_phase[phase_id] = [
            item["deliverable"] for item in sorted(
                deliverables_by_phase[phase_id], key=lambda x: x["sort_order"]
            )
        ]

    modules = _fetch_single(
        "system_blueprint_modules",
        "id, module_key, display_order, name, category, for_who, description",
        "version_id",
        version_id
    )
    modules = sorted(modules, key=lambda x: x["display_order"])
    module_ids = [module["id"] for module in modules]
    capabilities = []
    kpis = []
    if module_ids:
        capabilities = supabase_admin.table("system_blueprint_module_capabilities") \
            .select("module_id, capability, sort_order") \
            .in_("module_id", module_ids).execute().data
        kpis = supabase_admin.table("system_blueprint_module_kpis") \
            .select("module_id, kpi_key, sort_order") \
            .in_("module_id", module_ids).execute().data

    capabilities_by_module = defaultdict(list)
    for row in capabilities:
        capabilities_by_module[row["module_id"]].append(row)
    for module_id in capabilities_by_module:
        capabilities_by_module[module_id] = [
            item["capability"] for item in sorted(
                capabilities_by_module[module_id], key=lambda x: x["sort_order"]
            )
        ]

    kpis_by_module = defaultdict(list)
    for row in kpis:
        kpis_by_module[row["module_id"]].append(row)
    for module_id in kpis_by_module:
        kpis_by_module[module_id] = [
            item["kpi_key"] for item in sorted(
                kpis_by_module[module_id], key=lambda x: x["sort_order"]
            )
        ]

    channels = _fetch_single(
        "system_blueprint_notification_channels",
        "channel_key, sort_order",
        "version_id",
        version_id
    )
    channels = [x["channel_key"] for x in sorted(channels, key=lambda x: x["sort_order"])]

    engines = _fetch_single(
        "system_blueprint_alert_engines",
        "id, name, sort_order",
        "version_id",
        version_id
    )
    engines = sorted(engines, key=lambda x: x["sort_order"])
    engine_ids = [engine["id"] for engine in engines]
    examples = []
    if engine_ids:
        examples = supabase_admin.table("system_blueprint_alert_examples") \
            .select("engine_id, example_text, sort_order") \
            .in_("engine_id", engine_ids).execute().data
    examples_by_engine = defaultdict(list)
    for row in examples:
        examples_by_engine[row["engine_id"]].append(row)
    for engine_id in examples_by_engine:
        examples_by_engine[engine_id] = [
            item["example_text"] for item in sorted(
                examples_by_engine[engine_id], key=lambda x: x["sort_order"]
            )
        ]

    escalation = _fetch_single(
        "system_blueprint_escalation_policy",
        "policy_key, policy_value, sort_order",
        "version_id",
        version_id
    )
    escalation_policy = {
        row["policy_key"]: row["policy_value"]
        for row in sorted(escalation, key=lambda x: x["sort_order"])
    }

    core_entities = _fetch_single(
        "system_blueprint_core_entities",
        "entity_name, sort_order",
        "version_id",
        version_id
    )
    core_entities = [x["entity_name"] for x in sorted(core_entities, key=lambda x: x["sort_order"])]

    integration_targets = _fetch_single(
        "system_blueprint_integration_targets",
        "target_name, sort_order",
        "version_id",
        version_id
    )
    integration_targets = [
        x["target_name"] for x in sorted(integration_targets, key=lambda x: x["sort_order"])
    ]

    return {
        "meta": {
            "id": version["id"],
            "version_key": version["version_key"],
            "product_name": version["product_name"],
            "version": version["version_key"],
            "language": version["language"],
            "direction": version["direction"],
            "last_updated": str(version["last_updated"]),
            "positioning": version["positioning"],
            "target_companies": target_companies,
            "is_published": version["is_published"],
            "published_at": version["published_at"],
            "created_at": version["created_at"],
            "updated_at": version["updated_at"],
        },
        "implementation_phases": [
            {
                "id": phase["id"],
                "phase": phase["phase_number"],
                "name": phase["name"],
                "duration_weeks": phase["duration_weeks"],
                "deliverables": deliverables_by_phase.get(phase["id"], [])
            }
            for phase in phases
        ],
        "modules": [
            {
                "id": module["module_key"],
                "row_id": module["id"],
                "order": module["display_order"],
                "name": module["name"],
                "category": module["category"],
                "for_who": module["for_who"],
                "description": module["description"],
                "capabilities": capabilities_by_module.get(module["id"], []),
                "kpis": kpis_by_module.get(module["id"], [])
            }
            for module in modules
        ],
        "smart_notifications": {
            "channels": channels,
            "engines": [
                {
                    "id": engine["id"],
                    "name": engine["name"],
                    "examples": examples_by_engine.get(engine["id"], [])
                }
                for engine in engines
            ],
            "escalation_policy": escalation_policy
        },
        "core_entities": core_entities,
        "integration_targets": integration_targets
    }


@router.get("")
async def get_system_blueprint():
    """Return the currently published blueprint payload."""
    published = supabase_admin.table("system_blueprint_versions") \
        .select("id, published_at") \
        .eq("is_published", True) \
        .order("published_at", desc=True) \
        .limit(1).execute().data
    if not published:
        raise HTTPException(status_code=404, detail="No published blueprint version found")
    return build_blueprint_payload(published[0]["id"])


@router.get("/versions")
async def get_system_blueprint_versions():
    """Return all blueprint versions with summary fields."""
    versions = supabase_admin.table("system_blueprint_versions") \
        .select("id, version_key, product_name, is_published, published_at, last_updated, created_at, updated_at") \
        .order("created_at", desc=True).execute().data
    return versions
