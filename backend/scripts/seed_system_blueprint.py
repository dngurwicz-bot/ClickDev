"""Seed script for system blueprint tables."""

from datetime import date, datetime
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import supabase_admin


VERSION_KEY = "3.0"


def _clear_version(version_id: str):
    supabase_admin.table("system_blueprint_target_companies").delete().eq("version_id", version_id).execute()
    phases = supabase_admin.table("system_blueprint_phases").select("id").eq("version_id", version_id).execute().data
    phase_ids = [item["id"] for item in phases]
    if phase_ids:
        supabase_admin.table("system_blueprint_phase_deliverables").delete().in_("phase_id", phase_ids).execute()
    supabase_admin.table("system_blueprint_phases").delete().eq("version_id", version_id).execute()

    modules = supabase_admin.table("system_blueprint_modules").select("id").eq("version_id", version_id).execute().data
    module_ids = [item["id"] for item in modules]
    if module_ids:
        supabase_admin.table("system_blueprint_module_capabilities").delete().in_("module_id", module_ids).execute()
        supabase_admin.table("system_blueprint_module_kpis").delete().in_("module_id", module_ids).execute()
    supabase_admin.table("system_blueprint_modules").delete().eq("version_id", version_id).execute()

    supabase_admin.table("system_blueprint_notification_channels").delete().eq("version_id", version_id).execute()
    engines = supabase_admin.table("system_blueprint_alert_engines").select("id").eq("version_id", version_id).execute().data
    engine_ids = [item["id"] for item in engines]
    if engine_ids:
        supabase_admin.table("system_blueprint_alert_examples").delete().in_("engine_id", engine_ids).execute()
    supabase_admin.table("system_blueprint_alert_engines").delete().eq("version_id", version_id).execute()
    supabase_admin.table("system_blueprint_escalation_policy").delete().eq("version_id", version_id).execute()
    supabase_admin.table("system_blueprint_core_entities").delete().eq("version_id", version_id).execute()
    supabase_admin.table("system_blueprint_integration_targets").delete().eq("version_id", version_id).execute()


def seed():
    version_payload = {
        "version_key": VERSION_KEY,
        "product_name": "CLICK",
        "language": "he-IL",
        "direction": "rtl",
        "positioning": "ניהול מחזור חיי עובד - המפרט המלא",
        "last_updated": str(date.today()),
        "is_published": False,
    }

    existing = supabase_admin.table("system_blueprint_versions").select("*").eq("version_key", VERSION_KEY).limit(1).execute().data
    if existing:
        version = supabase_admin.table("system_blueprint_versions").update(version_payload).eq("id", existing[0]["id"]).execute().data[0]
    else:
        version = supabase_admin.table("system_blueprint_versions").insert(version_payload).execute().data[0]
    version_id = version["id"]

    _clear_version(version_id)

    target_companies = ["SMB", "Mid-Market", "Enterprise", "Public Sector"]
    for i, company in enumerate(target_companies, start=1):
        supabase_admin.table("system_blueprint_target_companies").insert(
            {"version_id": version_id, "company_type": company, "sort_order": i}
        ).execute()

    phases = [
        ("Foundation", 8, [
            "Multi-tenant core", "RBAC + Audit", "HR Core entities", "SSO and security baseline"
        ]),
        ("Operational Excellence", 10, [
            "Workflow automation", "Document generation", "Org chart visualization", "Task and reminder center"
        ]),
        ("Scale and Intelligence", 12, [
            "BI dashboards", "Predictive alerts", "Executive cockpit", "Integrations hub"
        ]),
    ]
    for idx, (name, duration, deliverables) in enumerate(phases, start=1):
        phase = supabase_admin.table("system_blueprint_phases").insert({
            "version_id": version_id,
            "phase_number": idx,
            "name": name,
            "duration_weeks": duration
        }).execute().data[0]
        for j, deliverable in enumerate(deliverables, start=1):
            supabase_admin.table("system_blueprint_phase_deliverables").insert({
                "phase_id": phase["id"],
                "deliverable": deliverable,
                "sort_order": j
            }).execute()

    modules = [
        ("core", "CLICK Core", "חובה (Base)", "לכל ארגון, כתשתית בסיסית.",
         "מנוע הנתונים המרכזי לניהול עובדים, מבנה ארגוני ותיעוד היסטורי מלא.", False,
         [
             "תיק עובד חכם: פרופיל 360, פרטים אישיים ובנקאיים.",
             "ציר זמן היסטורי: תיעוד רציף של כל שינוי תפקיד/סטטוס.",
             "ניהול מבנה ארגוני: הגדרת מחלקות, מנהלים וכפיפויות."
         ],
         ["profile_completion_rate", "employee_data_accuracy", "org_structure_coverage"]),
        ("flow", "CLICK Flow", "הכי נמכר", "ארגונים שמגייסים וקולטים עובדים.",
         "מנוע אוטומציות מקצה לקצה לכל מחזור חיי העובד.", False,
         [
             "Onboarding אוטומטי: מסלול מלא מגיוס ועד יום ראשון בעבודה.",
             "טפסים דיגיטליים: טופס 101, קליטה וטיולים (ללא נייר).",
             "חוזה העסקה: מחולל חוזים חכם + חתימה דיגיטלית למועמדים."
         ],
         ["onboarding_cycle_time", "task_sla", "first_day_readiness"]),
        ("docs", "CLICK Docs", "מסמכים בקליק", "למנהלות מש\"א שטובעות בניירת ידנית.",
         "מערכת מסמכים חכמה עם תבניות דינמיות והפקת PDF אוטומטית.", True,
         [
             "מכתבים נפוצים: אישור העסקה לבנק, מכתב המלצה ללימודים, אישור ותק.",
             "מכתבי סטטוס: הודעה על קידום, מכתב שינוי שכר, מכתב סיום העסקה.",
             "אוטומציה: המערכת שואבת לבד את התאריך, השם והלוגו. אפס טעויות הקלדה."
         ],
         ["document_generation_time", "template_reuse_rate", "document_error_rate"]),
        ("vision", "CLICK Vision", "ויזואליזציה", "למנכ\"לים, הנהלה ומשקיעים.",
         "שכבת תצוגה ויזואלית למבנה הארגון, עומסים ותלויות.", True,
         [
             "עץ ארגוני חי (Org Chart): תצוגה ויזואלית של מי מדווח למי.",
             "זיהוי חורים: קל לראות איזה צוות גדול מדי ואיפה חסרים מנהלים.",
             "זום-אין: אפשרות להתמקד במחלקה ספציפית ולראות את המבנה שלה.",
             "אפקט ה-WOW: הכלי המושלם להצגת הארגון בישיבות הנהלה."
         ],
         ["manager_span_of_control", "vacancy_visibility", "org_design_latency"]),
        ("assets", "CLICK Assets", "תפעול", "חברות עם צי רכב וציוד IT.",
         "מעקב הקצאות ציוד, תחזוקה והחזרות לפי עובד ותפקיד.", False,
         [
             "ניהול צי רכב: מעקב נהגים, ביטוחים, טסטים ודוחות.",
             "מלאי IT: מעקב אחרי מחשבים וציוד אצל העובדים."
         ],
         ["asset_utilization", "asset_loss_rate", "maintenance_sla"]),
        ("vibe", "CLICK Vibe", "רווחה", "לשימור עובדים ותרבות ארגונית.",
         "מרכז חוויית עובד: אירועים, הודעות, סקרים וקהילה.", False,
         [
             "פורטל עובד: אזור אישי, לוח מודעות וחדשות.",
             "אירועים: ניהול ימי הולדת, ותק ומתנות חג.",
             "Pulse: סקרי שביעות רצון מהירים."
         ],
         ["engagement_score", "event_participation", "eNPS"]),
        ("grow", "CLICK Grow", "מתקדם", "לניהול ביצועים ופיתוח.",
         "מחזור ביצועים שנתי/חצי שנתי עם תוכניות פיתוח אישיות.", False,
         [
             "תהליכי משוב: הערכת עובד שנתית/חצי שנתית.",
             "תיעוד שיחות: מעקב אחרי שיחות חתך ויעדים."
         ],
         ["goal_completion", "review_completion_rate", "internal_mobility_rate"]),
        ("insights", "CLICK Insights", "BI & Analytics", "לקבלת החלטות הנהלה.",
         "דוחות מתקדמים, חיזוי וניתוחים בזמן אמת על בסיס כלל המודולים.", False,
         [
             "דשבורדים: נתוני עזיבה, גיוס, ועלויות בזמן אמת.",
             "חיתוך נתונים: דוחות מתקדמים ומותאמים אישית."
         ],
         ["attrition_rate", "time_to_fill", "people_cost_ratio", "pay_equity_index"]),
    ]

    for i, module in enumerate(modules, start=1):
        module_key, name, category, for_who, description, highlighted, capabilities, kpis = module
        module_row = supabase_admin.table("system_blueprint_modules").insert({
            "version_id": version_id,
            "module_key": module_key,
            "display_order": i,
            "name": name,
            "category": category,
            "for_who": for_who,
            "description": description,
            "is_highlighted": highlighted
        }).execute().data[0]
        for j, capability in enumerate(capabilities, start=1):
            supabase_admin.table("system_blueprint_module_capabilities").insert({
                "module_id": module_row["id"],
                "capability": capability,
                "sort_order": j
            }).execute()
        for j, kpi in enumerate(kpis, start=1):
            supabase_admin.table("system_blueprint_module_kpis").insert({
                "module_id": module_row["id"],
                "kpi_key": kpi,
                "sort_order": j
            }).execute()

    channels = ["in_app", "email", "push", "slack", "teams"]
    for i, channel in enumerate(channels, start=1):
        supabase_admin.table("system_blueprint_notification_channels").insert({
            "version_id": version_id,
            "channel_key": channel,
            "sort_order": i
        }).execute()

    engines = [
        ("Personal Alerts", ["לדני מהצוות יש יום הולדת מחר", "חתימת חוזה ממתינה לאישור", "עובד חדש לא סיים טופס 101"]),
        ("Operational Alerts", ["ביטוח רכב מסתיים בעוד 7 ימים", "חוזה זמני עומד לפוג", "SLA משימת קליטה חרג מהיעד"]),
        ("Executive Alerts", ["עלייה חריגה בשיעור עזיבה במחלקת פיתוח", "פער מגדרי בשכר מעל סף מדיניות", "ירידה במדד שביעות רצון שבועי"]),
    ]
    for i, (name, examples) in enumerate(engines, start=1):
        engine_row = supabase_admin.table("system_blueprint_alert_engines").insert({
            "version_id": version_id,
            "name": name,
            "sort_order": i
        }).execute().data[0]
        for j, example in enumerate(examples, start=1):
            supabase_admin.table("system_blueprint_alert_examples").insert({
                "engine_id": engine_row["id"],
                "example_text": example,
                "sort_order": j
            }).execute()

    escalation_policy = [
        ("t_plus_24h", "תזכורת לבעל המשימה"),
        ("t_plus_48h", "הסלמה למנהל ישיר"),
        ("t_plus_72h", "הסלמה ל-HRBP/הנהלה"),
    ]
    for i, (key, value) in enumerate(escalation_policy, start=1):
        supabase_admin.table("system_blueprint_escalation_policy").insert({
            "version_id": version_id,
            "policy_key": key,
            "policy_value": value,
            "sort_order": i
        }).execute()

    core_entities = [
        "organizations", "user_roles", "employees", "employee_events",
        "org_units", "positions", "job_titles", "job_grades",
        "documents", "document_templates", "workflow_instances",
        "tasks", "asset_items", "asset_assignments", "pulse_surveys",
        "performance_reviews", "goals", "alerts", "audit_logs"
    ]
    for i, entity in enumerate(core_entities, start=1):
        supabase_admin.table("system_blueprint_core_entities").insert({
            "version_id": version_id,
            "entity_name": entity,
            "sort_order": i
        }).execute()

    integrations = [
        "Payroll (Hashavshevet, Michpal, Hilan)",
        "Identity (Azure AD/Okta)",
        "Communication (Slack/Teams)",
        "Signature providers",
        "BI warehouses (BigQuery/Snowflake)"
    ]
    for i, target in enumerate(integrations, start=1):
        supabase_admin.table("system_blueprint_integration_targets").insert({
            "version_id": version_id,
            "target_name": target,
            "sort_order": i
        }).execute()

    supabase_admin.table("system_blueprint_versions").update({"is_published": False}).eq("is_published", True).execute()
    supabase_admin.table("system_blueprint_versions").update({
        "is_published": True,
        "published_at": datetime.utcnow().isoformat()
    }).eq("id", version_id).execute()

    print(f"Blueprint seed completed for version {VERSION_KEY} ({version_id})")


if __name__ == "__main__":
    seed()
