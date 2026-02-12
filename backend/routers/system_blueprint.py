"""System blueprint API for CLICK product modules and implementation data."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/system-blueprint", tags=["System Blueprint"])


@router.get("")
async def get_system_blueprint():
    """Return an end-to-end professional blueprint for the CLICK platform."""
    return {
        "meta": {
            "product_name": "CLICK",
            "version": "3.0",
            "language": "he-IL",
            "direction": "rtl",
            "last_updated": "2026-02-11",
            "positioning": "ניהול מחזור חיי עובד - המפרט המלא",
            "target_companies": [
                "SMB",
                "Mid-Market",
                "Enterprise",
                "Public Sector"
            ]
        },
        "implementation_phases": [
            {
                "phase": 1,
                "name": "Foundation",
                "duration_weeks": 8,
                "deliverables": [
                    "Multi-tenant core",
                    "RBAC + Audit",
                    "HR Core entities",
                    "SSO and security baseline"
                ]
            },
            {
                "phase": 2,
                "name": "Operational Excellence",
                "duration_weeks": 10,
                "deliverables": [
                    "Workflow automation",
                    "Document generation",
                    "Org chart visualization",
                    "Task and reminder center"
                ]
            },
            {
                "phase": 3,
                "name": "Scale and Intelligence",
                "duration_weeks": 12,
                "deliverables": [
                    "BI dashboards",
                    "Predictive alerts",
                    "Executive cockpit",
                    "Integrations hub"
                ]
            }
        ],
        "modules": [
            {
                "id": "core",
                "order": 1,
                "name": "CLICK Core",
                "category": "חובה (Base)",
                "for_who": "לכל ארגון, כתשתית בסיסית.",
                "description": "מנוע הנתונים המרכזי לניהול עובדים, מבנה ארגוני ותיעוד היסטורי מלא.",
                "capabilities": [
                    "תיק עובד חכם: פרופיל 360, מסמכים, אירועים ובקרות איכות",
                    "ציר זמן היסטורי: מעקב שינויים ברמת שדה עם who/when/why",
                    "ניהול מבנה ארגוני: אגפים, מחלקות, יחידות ותפקידי ניהול",
                    "אימות והרשאות: RBAC מלא + הפרדה בין ארגונים"
                ],
                "kpis": ["profile_completion_rate", "employee_data_accuracy", "org_structure_coverage"]
            },
            {
                "id": "flow",
                "order": 2,
                "name": "CLICK Flow",
                "category": "הכי נמכר",
                "for_who": "ארגונים שמגייסים וקולטים עובדים.",
                "description": "מנוע אוטומציות מקצה לקצה לכל מחזור חיי העובד.",
                "capabilities": [
                    "Onboarding אוטומטי: מפת משימות לפי תפקיד/מחלקה",
                    "טפסים דיגיטליים: טופס 101, קליטה וטפסי חברה",
                    "Workflows מותנים: אישורים חוצי יחידות (HR, IT, שכר)",
                    "חוזה העסקה: תבנית חכמה + שילוב חתימה דיגיטלית"
                ],
                "kpis": ["onboarding_cycle_time", "task_sla", "first_day_readiness"]
            },
            {
                "id": "docs",
                "order": 3,
                "name": "CLICK Docs",
                "category": "מסמכים בקליק",
                "for_who": "מנהלות משאבי אנוש שרוצות דיוק ומהירות.",
                "description": "מערכת מסמכים חכמה עם תבניות דינמיות והפקת PDF אוטומטית.",
                "capabilities": [
                    "מכתבים נפוצים: אישור העסקה, הצלחה לנבחר/ת, כתב מינוי",
                    "מכתבי סטטוס: שכר, קידום, סיום העסקה והודעה על שינוי",
                    "אוטומציה: מילוי שדות מתוך נתוני עובד וארגון",
                    "ניהול גרסאות: שמירה, השוואה ואישור משפטי"
                ],
                "kpis": ["document_generation_time", "template_reuse_rate", "document_error_rate"]
            },
            {
                "id": "vision",
                "order": 4,
                "name": "CLICK Vision",
                "category": "ויזואליזציה",
                "for_who": "למנהלים, הנהלה ומשקיעים.",
                "description": "שכבת תצוגה ויזואלית למבנה הארגון, עומסים ותלויות.",
                "capabilities": [
                    "עץ ארגוני חי (Org Chart) עם drill-down לרמות עומק",
                    "זיהוי חורים: איתור עומס או חוסר מנהל/ת ביחידה",
                    "zoom-in על מחלקות: פירוט מבנה ותפקידי מפתח",
                    "מצב WOW להצגת ישיבות הנהלה ודירקטוריון"
                ],
                "kpis": ["manager_span_of_control", "vacancy_visibility", "org_design_latency"]
            },
            {
                "id": "assets",
                "order": 5,
                "name": "CLICK Assets",
                "category": "תפעול",
                "for_who": "חברות עם ציוד רכב ו-IT.",
                "description": "מעקב הקצאות ציוד, תחזוקה והחזרות לפי עובד ותפקיד.",
                "capabilities": [
                    "ניהול צי רכב: הקצאות, ביטוחים, טיפולים ודוחות חריגה",
                    "מלאי IT: מחשבים, טלפונים, ציוד היקפי ורישוי תוכנה",
                    "שרשרת אחריות: מי קיבל, ממי, ומתי הוחזר",
                    "התראות סף: אחריות, רענון ציוד ותקלות חוזרות"
                ],
                "kpis": ["asset_utilization", "asset_loss_rate", "maintenance_sla"]
            },
            {
                "id": "vibe",
                "order": 6,
                "name": "CLICK Vibe",
                "category": "רווחה",
                "for_who": "לשימור עובדים ותרבות ארגונית.",
                "description": "מרכז חוויית עובד: אירועים, הודעות, סקרים וקהילה.",
                "capabilities": [
                    "פורטל עובד אישי: חדשות, קהילה, ידע ושירותים",
                    "אירועים: ימי הולדת, חגים, נוכחות ואישורי השתתפות",
                    "Pulse שבועי: סקרי שביעות רצון מהירים",
                    "Employee Voice: רעיונות ושאלות אנונימיות"
                ],
                "kpis": ["engagement_score", "event_participation", "eNPS"]
            },
            {
                "id": "grow",
                "order": 7,
                "name": "CLICK Grow",
                "category": "מתקדם",
                "for_who": "ניהול ביצועים ופיתוח קריירה.",
                "description": "מחזור ביצועים שנתי/חצי שנתי עם תוכניות פיתוח אישיות.",
                "capabilities": [
                    "תהליכי משוב: יעדים, הערכות תקופתיות ו-360",
                    "תיעוד שיחות: 1:1, סיכומי מנהל ונקודות פעולה",
                    "מפת כישורים: Skill matrix לפי תפקיד",
                    "מסלולי קריירה: תוכניות יורשים ותחלופה פנימית"
                ],
                "kpis": ["goal_completion", "review_completion_rate", "internal_mobility_rate"]
            },
            {
                "id": "insights",
                "order": 8,
                "name": "CLICK Insights",
                "category": "BI & Analytics",
                "for_who": "לקבלת החלטות הנהלה.",
                "description": "דוחות מתקדמים, חיזוי וניתוחים בזמן אמת על בסיס כלל המודולים.",
                "capabilities": [
                    "דשבורדים: עזיבה, גיוס, עלויות, absenteeism ותפוקות",
                    "חיבור נתונים: שכבת ETL למקורות ארגוניים נוספים",
                    "חיזוי נטישה: סימון עובדים בסיכון",
                    "ניתוח שכר: פערי שכר ותאימות רגולציה"
                ],
                "kpis": ["attrition_rate", "time_to_fill", "people_cost_ratio", "pay_equity_index"]
            }
        ],
        "smart_notifications": {
            "channels": ["in_app", "email", "push", "slack", "teams"],
            "engines": [
                {
                    "name": "Personal Alerts",
                    "examples": [
                        "לדן יש יום הולדת מחר",
                        "חתימת חוזה ממתינה לאישור",
                        "עובד חדש לא סיים טופס 101"
                    ]
                },
                {
                    "name": "Operational Alerts",
                    "examples": [
                        "ביטוח רכב מסתיים בעוד 7 ימים",
                        "חוזה זמני עומד לפוג",
                        "SLA משימת קליטה חרג מהיעד"
                    ]
                },
                {
                    "name": "Executive Alerts",
                    "examples": [
                        "עלייה חריגה בשיעור עזיבה במחלקת פיתוח",
                        "פער מגדרי בשכר מעל סף מדיניות",
                        "ירידה במדד שביעות רצון שבועי"
                    ]
                }
            ],
            "escalation_policy": {
                "t_plus_24h": "תזכורת לבעל המשימה",
                "t_plus_48h": "הסלמה למנהל ישיר",
                "t_plus_72h": "הסלמה ל-HRBP/הנהלה"
            }
        },
        "core_entities": [
            "organizations", "user_roles", "employees", "employee_events",
            "org_units", "positions", "job_titles", "job_grades",
            "documents", "document_templates", "workflow_instances",
            "tasks", "asset_items", "asset_assignments", "pulse_surveys",
            "performance_reviews", "goals", "alerts", "audit_logs"
        ],
        "integration_targets": [
            "Payroll (Hashavshevet, Michpal, Hilan)",
            "Identity (Azure AD/Okta)",
            "Communication (Slack/Teams)",
            "Signature providers",
            "BI warehouses (BigQuery/Snowflake)"
        ]
    }
