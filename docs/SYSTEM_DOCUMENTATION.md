# CLICK - תיעוד מערכת מלא

## מערכת ניהול משאבי אנוש רב-ארגונית (Multi-Tenant HR Management System)

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [ארכיטקטורת המערכת](#2-ארכיטקטורת-המערכת)
3. [טכנולוגיות ותשתיות](#3-טכנולוגיות-ותשתיות)
4. [מבנה הפרויקט](#4-מבנה-הפרויקט)
5. [מסד הנתונים](#5-מסד-הנתונים)
6. [ממשק ה-API (Backend)](#6-ממשק-ה-api-backend)
7. [ממשק המשתמש (Frontend)](#7-ממשק-המשתמש-frontend)
8. [אימות והרשאות](#8-אימות-והרשאות)
9. [מודולים עיקריים](#9-מודולים-עיקריים)
10. [תהליכי עבודה מרכזיים](#10-תהליכי-עבודה-מרכזיים)
11. [עיצוב ו-UI](#11-עיצוב-ו-ui)
12. [התקנה והרצה](#12-התקנה-והרצה)
13. [משתני סביבה](#13-משתני-סביבה)

---

## 1. סקירה כללית

### מה זה CLICK?

**CLICK** היא מערכת ניהול משאבי אנוש (HR) מלאה, המיועדת לשרת מספר ארגונים במקביל (Multi-Tenant). המערכת בנויה בהשראת מערכות HR מקצועיות כמו **חילן (Hilan)**, עם דגש על תמיכה מלאה בעברית, כתיבה מימין לשמאל (RTL), ותהליכי HR ישראליים.

### מה המערכת עושה?

המערכת מספקת את היכולות הבאות:

- **ניהול ארגונים** - יצירה, עריכה ומחיקה של ארגונים מרובים, כל אחד עם הגדרות עצמאיות
- **ניהול עובדים** - תיקי עובדים מלאים בסגנון חילן, כולל מעקב היסטורי אחר שינויים
- **מבנה ארגוני** - הגדרת היררכיה ארגונית עם אגפים, מחלקות, יחידות ומשרות
- **סיווג תפקידים** - ניהול דרגות ותארי תפקיד
- **לוח בקרה למנהל על (Super Admin)** - סטטיסטיקות, ניתוחים, ניהול מנויים
- **מערכת הודעות** - הודעות מערכת גלובליות וממוקדות לארגונים ספציפיים
- **ניתוח נתונים ודוחות** - גרפים, ייצוא לאקסל/CSV, מעקב צמיחה
- **יומן פעילות** - מעקב מלא אחר כל הפעולות במערכת

### למי המערכת מיועדת?

| סוג משתמש | תפקיד | יכולות |
|---|---|---|
| **Super Admin** | מנהל המערכת הראשי | ניהול כל הארגונים, משתמשים, הגדרות גלובליות |
| **Organization Admin** | מנהל ארגון | ניהול עובדים, מבנה ארגוני, הגדרות הארגון שלו |
| **Manager** | מנהל צוות | צפייה בעובדים תחת אחריותו |
| **Employee** | עובד | צפייה בפרופיל אישי |

---

## 2. ארכיטקטורת המערכת

### תרשים כללי

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│         React 19 + TypeScript + Tailwind CSS           │
│              http://localhost:3000                      │
└─────────────────────┬──────────────────────────────────┘
                      │ HTTP/REST API
                      │ (next.config.js rewrites /api → backend)
                      ▼
┌────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                      │
│           Python 3.12 + Uvicorn (ASGI)                 │
│              http://localhost:8000                      │
└─────────────────────┬──────────────────────────────────┘
                      │ Supabase SDK
                      │ (REST API + Auth)
                      ▼
┌────────────────────────────────────────────────────────┐
│                 Supabase (PostgreSQL)                   │
│    Database + Auth + Storage + Row Level Security       │
└────────────────────────────────────────────────────────┘
```

### עקרונות ארכיטקטוניים

1. **Multi-Tenant (רב-ארגוני)** - כל טבלה מכילה `organization_id`, מה שמאפשר בידוד מוחלט בין ארגונים
2. **Event-Based Employee System** - שינויים בתיקי עובדים נשמרים כאירועים (Events), לא כעדכונים ישירים. זה מאפשר "מכונת זמן" - צפייה בנתונים היסטוריים
3. **Role-Based Access Control (RBAC)** - גישה לנתונים מבוססת תפקידים, הן ברמת ה-API והן ברמת מסד הנתונים (RLS)
4. **RTL-First** - כל העיצוב בנוי מימין לשמאל עם תמיכה מלאה בעברית

---

## 3. טכנולוגיות ותשתיות

### Backend (צד שרת)

| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| **Python** | 3.12 | שפת התכנות הראשית |
| **FastAPI** | 0.104.1 | פריימוורק ל-API - מהיר, אסינכרוני, עם תיעוד אוטומטי |
| **Uvicorn** | 0.24.0 | שרת ASGI להרצת FastAPI |
| **Supabase SDK** | 2.0.0 | לקוח Python לגישה למסד הנתונים |
| **Pydantic** | 2.5.0 | ולידציה של נתונים נכנסים ויוצאים |
| **PyJWT** | 2.8.1 | עבודה עם טוקנים של JWT |
| **httpx** | 0.24+ | קריאות HTTP אסינכרוניות (אימות טוקנים) |
| **ReportLab** | 4.0.7 | יצירת קבצי PDF |
| **passlib** | 1.7.4 | הצפנת סיסמאות (bcrypt) |

### Frontend (צד לקוח)

| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| **Next.js** | 16.1.2 | פריימוורק React עם App Router, SSR, ניתוב מבוסס קבצים |
| **React** | 19.2.3 | ספריית UI ראשית |
| **TypeScript** | 5.3.3 | Type Safety לכל הקוד |
| **Tailwind CSS** | 3.3.6 | עיצוב Utility-First עם תמיכת RTL |
| **Radix UI** | - | קומפוננטות UI נגישות ולא מעוצבות (avatar, select, tabs...) |
| **TanStack Table** | 8.21.3 | טבלאות נתונים מתקדמות עם סינון, מיון ועימוד |
| **React Hook Form** | 7.49.2 | ניהול טפסים עם ביצועים גבוהים |
| **Zod** | 3.22.4 | ולידציה של טפסים (schema validation) |
| **TipTap** | 3.16.0 | עורך טקסט עשיר (Rich Text Editor) |
| **Recharts** | 3.7.0 | גרפים ותרשימים |
| **XLSX** | 0.18.5 | ייצוא נתונים לאקסל |
| **Framer Motion** | 12.26.2 | אנימציות |
| **date-fns** | 2.30.0 | טיפול בתאריכים |

### תשתית ומסד נתונים

| טכנולוגיה | שימוש |
|---|---|
| **Supabase** | פלטפורמת Backend-as-a-Service - מסד נתונים PostgreSQL, אימות, אחסון קבצים |
| **PostgreSQL** | מסד נתונים יחסי (דרך Supabase) |
| **Row Level Security** | מדיניות אבטחה ברמת השורה לבידוד נתונים בין ארגונים |
| **Supabase Auth** | מערכת אימות מובנית (email/password) |
| **Supabase Storage** | אחסון קבצים (לוגואים, מסמכים) |

---

## 4. מבנה הפרויקט

```
ClickDev/
│
├── backend/                              # צד שרת - FastAPI
│   ├── main.py                          # נקודת כניסה - אגרגציית ראוטרים
│   ├── database.py                      # אתחול Supabase Client
│   ├── dependencies.py                  # אימות, בקרת הרשאות, לוגים
│   ├── schemas.py                       # מודלים של Pydantic (ולידציה)
│   ├── requirements.txt                 # תלויות Python
│   └── routers/                         # נתיבי API לפי תחום
│       ├── organizations.py             # ניהול ארגונים (CRUD)
│       ├── users.py                     # ניהול משתמשים והזמנות
│       ├── employees.py                 # ניהול עובדים (מבוסס אירועים)
│       ├── core.py                      # דרגות, תארים, יחידות, משרות
│       ├── admin.py                     # דשבורד, הודעות, משימות
│       └── analytics.py                 # דוחות, ניתוחים, ייצוא
│
├── frontend/                             # צד לקוח - Next.js
│   ├── app/                             # App Router (ניתוב מבוסס קבצים)
│   │   ├── layout.tsx                   # Layout ראשי עם Providers
│   │   ├── page.tsx                     # דף בית (הפניה לדשבורד/התחברות)
│   │   ├── login/                       # דפי התחברות
│   │   ├── auth/                        # עדכון סיסמה
│   │   ├── forgot-password/             # שחזור סיסמה
│   │   │
│   │   ├── admin/                       # דשבורד מנהל על
│   │   │   ├── dashboard/               # סטטיסטיקות ופעילות אחרונה
│   │   │   ├── organizations/           # ניהול ארגונים
│   │   │   ├── users/                   # ניהול משתמשים
│   │   │   ├── announcements/           # הודעות מערכת
│   │   │   ├── analytics/               # דשבורד ניתוחים
│   │   │   ├── settings/                # הגדרות מערכת
│   │   │   └── subscription-tiers/      # ניהול מנויים
│   │   │
│   │   └── dashboard/                   # דשבורד ארגוני
│   │       ├── core/                    # מודולי HR
│   │       │   ├── employees/           # ניהול עובדים
│   │       │   ├── departments/         # יחידות ארגוניות
│   │       │   ├── titles/              # תארי תפקיד
│   │       │   ├── grades/              # דרגות
│   │       │   └── settings/            # הגדרות ארגון
│   │       └── profile/                 # פרופיל משתמש
│   │
│   ├── components/                      # קומפוננטות React
│   │   ├── ui/                          # קומפוננטות בסיס (button, card, modal...)
│   │   ├── admin/                       # קומפוננטות מנהל על
│   │   ├── core/                        # קומפוננטות HR Core
│   │   ├── employees/                   # קומפוננטות עובדים
│   │   ├── dashboard/                   # קומפוננטות דשבורד
│   │   ├── layout/                      # Header, Sidebar
│   │   ├── DataTable.tsx                # טבלת נתונים מתקדמת (TanStack)
│   │   ├── ExportModal.tsx              # דיאלוג ייצוא לאקסל
│   │   └── RichTextEditor.tsx           # עורך טקסט עשיר
│   │
│   ├── lib/                             # ספריות ועזרים
│   │   ├── supabase.ts                  # אתחול Supabase Client
│   │   ├── auth.ts                      # פונקציות עזר לאימות
│   │   ├── api.ts                       # authFetch - קריאות API עם אימות
│   │   ├── activity-logger.ts           # לוגים של פעולות
│   │   ├── utils.ts                     # פונקציות עזר כלליות
│   │   ├── contexts/                    # React Context Providers
│   │   │   ├── OrganizationContext.tsx   # בחירת ארגון נוכחי
│   │   │   ├── SidebarContext.tsx        # מצב Sidebar
│   │   │   └── InactivityContext.tsx     # ניתוק אוטומטי (Timeout)
│   │   └── types/
│   │       └── models.ts                # TypeScript Interfaces
│   │
│   ├── tailwind.config.ts               # קונפיגורצית Tailwind (RTL)
│   └── next.config.js                   # קונפיגורצית Next.js (rewrites ל-Backend)
│
├── supabase/                             # מיגרציות מסד נתונים
│   └── migrations/                       # 35+ קבצי SQL מיגרציה
│
├── docs/                                 # תיעוד
│   └── hilan_pro/                        # תיעוד מערכת חילן (עברית)
│
└── package.json                          # סקריפטים להרצה (dev, build, install)
```

---

## 5. מסד הנתונים

### טבלאות עיקריות

#### organizations - ארגונים
הטבלה המרכזית שמאחסנת את כל הארגונים במערכת.

| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה ייחודי |
| `name` | TEXT | שם הארגון בעברית |
| `name_en` | TEXT | שם הארגון באנגלית |
| `org_number` | TEXT | מספר ארגון (5 ספרות, נוצר אוטומטית) |
| `email` | TEXT | אימייל ארגוני |
| `phone` | TEXT | טלפון |
| `logo_url` | TEXT | כתובת לוגו (Supabase Storage) |
| `address` | TEXT | כתובת |
| `active_modules` | JSONB | מודולים פעילים (למשל: ["core"]) |
| `subscription_tier` | TEXT | רמת מנוי (basic/pro/enterprise) |
| `subscription_amount` | NUMERIC | סכום מנוי חודשי |
| `is_active` | BOOLEAN | האם הארגון פעיל |
| `hierarchy_levels` | JSONB | רמות היררכיה ארגונית (אגף, מחלקה...) |
| `config_lock` | BOOLEAN | נעילת קונפיגורציה (מונע שינוי מבנה) |
| `created_by` | UUID | המשתמש שיצר את הארגון |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### user_roles - תפקידי משתמשים
קישור בין משתמשים לארגונים עם הגדרת תפקיד.

| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה ייחודי |
| `user_id` | UUID | מזהה המשתמש (מ-Supabase Auth) |
| `organization_id` | UUID | מזהה הארגון |
| `role` | ENUM | תפקיד: `super_admin`, `organization_admin`, `manager`, `employee` |

**אילוץ ייחודיות:** `(user_id, organization_id)` - משתמש יכול להיות פעם אחת בכל ארגון.

#### employees - עובדים
רשומות עובדים סטטיות.

| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה ייחודי |
| `organization_id` | UUID | הארגון שאליו שייך העובד |
| `employee_number` | TEXT | מספר עובד |
| `id_number` | TEXT | תעודת זהות |
| `first_name_he` | TEXT | שם פרטי בעברית |
| `last_name_he` | TEXT | שם משפחה בעברית |
| `father_name_he` | TEXT | שם האב בעברית |
| `birth_date` | DATE | תאריך לידה |
| `is_active` | BOOLEAN | סטטוס עובד |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### employee_events - אירועי עובדים (בסגנון חילן)
כל שינוי בנתוני עובד נשמר כאירוע - זה הלב של מערכת ניהול העובדים.

| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה ייחודי |
| `employee_id` | UUID | מזהה העובד |
| `event_code` | TEXT | קוד אירוע (200=פרטים אישיים, 101=כתובת, 552=...) |
| `operation_code` | TEXT | קוד פעולה: `' '`=הוספה, `'2'`=עדכון, `'3'`=מחיקה, `'4'`=קביעה |
| `event_data` | JSONB | נתוני האירוע (JSON גמיש) |
| `effective_from` | DATE | תאריך תחילת תוקף |
| `effective_to` | DATE | תאריך סיום תוקף |
| `created_by` | UUID | מי ביצע את הפעולה |
| `created_at` | TIMESTAMP | מתי בוצע |

#### job_grades - דרגות
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `organization_id` | UUID | ארגון |
| `name` | TEXT | שם הדרגה |
| `level` | INT | רמה מספרית |

#### job_titles - תארי תפקיד
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `organization_id` | UUID | ארגון |
| `title` | TEXT | שם התפקיד |
| `default_grade_id` | UUID | דרגת ברירת מחדל |

#### org_units - יחידות ארגוניות
מבנה עצי (היררכי) של הארגון.

| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `organization_id` | UUID | ארגון |
| `parent_id` | UUID | יחידת אב (NULL = שורש) |
| `name` | TEXT | שם היחידה |
| `type` | TEXT | סוג (אגף, מחלקה, תת-מחלקה...) |
| `manager_id` | UUID | מנהל היחידה |

#### positions - משרות
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `organization_id` | UUID | ארגון |
| `org_unit_id` | UUID | יחידה ארגונית |
| `job_title_id` | UUID | תאר תפקיד |
| `is_manager_position` | BOOLEAN | האם משרת ניהול |
| `occupant_id` | UUID | העובד שממלא את המשרה |
| `valid_from` | DATE | תאריך תחילה |

#### announcements - הודעות מערכת
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `title` | TEXT | כותרת |
| `content` | TEXT | תוכן (HTML) |
| `type` | TEXT | סוג: `info`, `warning`, `success`, `update` |
| `target_type` | TEXT | `all` (כולם) או `specific` (ארגונים ספציפיים) |
| `target_organizations` | JSONB | רשימת מזהי ארגונים (אם specific) |
| `is_active` | BOOLEAN | פעיל/לא פעיל |
| `created_by` | UUID | יוצר |

#### admin_tasks - משימות מנהל
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `title` | TEXT | כותרת |
| `description` | TEXT | תיאור |
| `priority` | TEXT | עדיפות: `low`, `medium`, `high` |
| `status` | TEXT | סטטוס |
| `assigned_to` | UUID | מוקצה ל |
| `due_date` | TIMESTAMP | תאריך יעד |

#### user_activity_logs - יומן פעילות
| עמודה | סוג | תיאור |
|---|---|---|
| `id` | UUID | מזהה |
| `user_id` | UUID | משתמש |
| `action_type` | TEXT | סוג פעולה (CREATE_ORGANIZATION, UPDATE_EMPLOYEE...) |
| `entity_type` | TEXT | סוג ישות (ORGANIZATION, EMPLOYEE...) |
| `entity_id` | UUID | מזהה הישות |
| `details` | JSONB | פרטים נוספים |
| `organization_id` | UUID | ארגון |
| `created_at` | TIMESTAMP | זמן הפעולה |

### מנגנוני מסד נתונים

- **Row Level Security (RLS)**: מדיניות אבטחה ברמת השורה - כל ארגון רואה רק את הנתונים שלו
- **Stored Procedures (RPC)**: לוגיקה עסקית מורכבת מבוצעת בפונקציות PL/pgSQL (למשל `create_employee_event`)
- **Triggers**: עדכון אוטומטי של חותמות זמן, מעקב שינויים
- **Constraints**: אילוצים לשמירה על תקינות נתונים (ולידציית ת.ז. ישראלית ועוד)
- **מיגרציות**: 35+ קבצי SQL ב-`supabase/migrations/` שמתעדים את כל האבולוציה של הסכמה

---

## 6. ממשק ה-API (Backend)

ה-Backend בנוי עם **FastAPI** ומחולק ל-6 ראוטרים (Routers), כל אחד אחראי על תחום עסקי אחר.

### 6.1 Organizations Router - ניהול ארגונים

**בסיס נתיב:** `/api/organizations`

| מתודה | נתיב | תיאור | הרשאה |
|---|---|---|---|
| `GET` | `/api/organizations` | רשימת כל הארגונים | Super Admin |
| `POST` | `/api/organizations` | יצירת ארגון חדש | Super Admin |
| `GET` | `/api/organizations/{org_id}` | פרטי ארגון ספציפי | Super Admin |
| `PUT` | `/api/organizations/{org_id}` | עדכון ארגון | Super Admin |
| `DELETE` | `/api/organizations/{org_id}` | מחיקת ארגון | Super Admin |
| `POST` | `/api/organizations/{org_id}/setup` | הגדרת מבנה היררכי | Super Admin |

**פרטים נוספים:**
- יצירת ארגון מייצרת אוטומטית `org_number` בן 5 ספרות
- Setup Wizard מאפשר להגדיר רמות היררכיה (אגף, מחלקה, תת-מחלקה) ולנעול את ההגדרה

### 6.2 Users Router - ניהול משתמשים

**בסיס נתיב:** `/api/users`

| מתודה | נתיב | תיאור | הרשאה |
|---|---|---|---|
| `GET` | `/api/users` | רשימת משתמשים | Super Admin |
| `POST` | `/api/users` | הזמנת משתמש חדש | Super Admin |
| `PUT` | `/api/users/{user_id}` | עדכון משתמש | Super Admin |
| `DELETE` | `/api/users/{user_id}` | מחיקת משתמש | Super Admin |

**פרטים נוספים:**
- הזמנת משתמש שולחת אימייל דרך Supabase Auth
- כל משתמש מקבל תפקיד (`super_admin`, `organization_admin`, `manager`, `employee`)

### 6.3 Employees Router - ניהול עובדים

**בסיס נתיב:** `/api/organizations/{org_id}/employees`

| מתודה | נתיב | תיאור | הרשאה |
|---|---|---|---|
| `GET` | `/api/organizations/{org_id}/employees` | רשימת עובדי ארגון | משתמש מאומת |
| `POST` | `/api/organizations/{org_id}/employees` | יצירה/עדכון עובד (Event-Based) | משתמש מאומת |

**מערכת האירועים:**

הניהול מבוסס על קודי פעולה וקודי אירוע:

| קוד פעולה | משמעות |
|---|---|
| `ADD` / `' '` | הוספת רשומה חדשה |
| `UPDATE` / `'2'` | עדכון רשומה |
| `DELETE` / `'3'` | מחיקת רשומה |
| `SET` / `'4'` | קביעת ערך |

| קוד אירוע | תחום |
|---|---|
| `200` | פרטים אישיים (Table 001) |
| `101` | כתובת (Table 101) |
| `552` | נתונים נוספים |

### 6.4 Core Router - ליבת HR

**נתיבים:**

| מתודה | נתיב | תיאור |
|---|---|---|
| `GET/POST` | `/api/organizations/{org_id}/job-grades` | דרגות |
| `GET/POST` | `/api/organizations/{org_id}/job-titles` | תארי תפקיד |
| `GET/POST` | `/api/organizations/{org_id}/org-units` | יחידות ארגוניות |
| `PUT/DELETE` | `/api/org-units/{unit_id}` | עדכון/מחיקת יחידה |
| `GET` | `/api/org-units/{unit_id}/history` | היסטוריית יחידה |
| `GET/POST` | `/api/organizations/{org_id}/positions` | משרות |
| `PUT/DELETE` | `/api/positions/{pos_id}` | עדכון/מחיקת משרה |
| `GET` | `/api/positions/{pos_id}/history` | היסטוריית משרה |

### 6.5 Admin Router - ניהול מערכת

**בסיס נתיב:** `/api`

| מתודה | נתיב | תיאור |
|---|---|---|
| `GET` | `/api/stats/dashboard` | סטטיסטיקות דשבורד |
| `GET` | `/api/announcements` | הודעות למשתמש הנוכחי |
| `POST` | `/api/announcements` | יצירת הודעה (Super Admin) |
| `PUT` | `/api/announcements/{id}` | עדכון הודעה |
| `DELETE` | `/api/announcements/{id}` | מחיקת הודעה |
| `GET` | `/api/tasks` | רשימת משימות מנהל |
| `POST` | `/api/tasks` | יצירת משימה |
| `PUT` | `/api/tasks/{id}` | עדכון משימה |
| `DELETE` | `/api/tasks/{id}` | מחיקת משימה |

### 6.6 Analytics Router - ניתוחים ודוחות

**בסיס נתיב:** `/api/stats`

| מתודה | נתיב | תיאור |
|---|---|---|
| `GET` | `/api/stats/dashboard` | סטטיסטיקות עיליות |
| `GET` | `/api/stats/analytics` | נתוני צמיחה, התפלגות מנויים, מדדים |
| `POST` | `/api/stats/reports/generate` | הפקת דוח CSV להורדה |

**נתוני ניתוח:**
- **Growth Data**: נתוני צמיחה ב-6 חודשים אחרונים
- **Distribution Data**: התפלגות לפי רמות מנוי (Basic, Pro, Enterprise)
- **Metrics**: שיעור נטישה (Churn Rate), סה"כ ארגונים, ארגונים פעילים

### Health Check

| מתודה | נתיב | תיאור |
|---|---|---|
| `GET` | `/` | בדיקת סטטוס API |
| `GET` | `/health` | בדיקת בריאות |

---

## 7. ממשק המשתמש (Frontend)

### 7.1 מערכת ניתוב (Pages)

#### דפי אימות
| נתיב | תיאור |
|---|---|
| `/login` | דף התחברות |
| `/forgot-password` | שחזור סיסמה |
| `/auth/update-password` | עדכון סיסמה |

#### דשבורד מנהל על (`/admin/*`)
| נתיב | תיאור |
|---|---|
| `/admin/dashboard` | דשבורד ראשי - סטטיסטיקות, פעילות אחרונה, MRR |
| `/admin/organizations` | רשימת ארגונים (טבלה, חיפוש, ייצוא) |
| `/admin/organizations/new` | יצירת ארגון חדש |
| `/admin/organizations/[id]` | פרטי ארגון (עריכה, Setup Wizard) |
| `/admin/users` | ניהול משתמשים (הזמנה, מחיקה, שינוי תפקידים) |
| `/admin/users/[id]` | פרטי משתמש |
| `/admin/announcements` | ניהול הודעות מערכת |
| `/admin/analytics` | גרפי צמיחה, התפלגות מנויים |
| `/admin/settings` | הגדרות מערכת |
| `/admin/subscription-tiers` | ניהול רמות מנוי |

#### דשבורד ארגוני (`/dashboard/*`)
| נתיב | תיאור |
|---|---|
| `/dashboard/core/employees` | ניהול עובדים (בסגנון חילן) |
| `/dashboard/core/departments` | יחידות ארגוניות (עץ היררכי) |
| `/dashboard/core/titles` | תארי תפקיד |
| `/dashboard/core/grades` | דרגות |
| `/dashboard/core/settings` | הגדרות ארגון |
| `/dashboard/profile` | פרופיל משתמש |

### 7.2 קומפוננטות מפתח

#### DataTable (טבלת נתונים מתקדמת)
- מבוססת על **TanStack React Table**
- סינון (Faceted Filters) - סינון מתקדם לפי עמודות
- מיון לפי כל עמודה
- עימוד (Pagination)
- ייצוא לאקסל (XLSX)
- עיצוב RTL מלא

#### Organization Context
- **React Context** שמנהל את הארגון הנוכחי
- שמירה ב-`localStorage` של הבחירה האחרונה
- Super Admin יכול לעבור בין ארגונים
- משתמש רגיל רואה רק את הארגונים שלו

#### Inactivity Context
- מעקב אחר חוסר פעילות
- ניתוק אוטומטי (Session Timeout) לאחר זמן מוגדר

#### Rich Text Editor
- מבוסס על **TipTap**
- תמיכה בעיצוב טקסט, צבעים, תמונות, קישורים
- שימוש בהודעות מערכת

---

## 8. אימות והרשאות

### תהליך אימות (Authentication Flow)

```
1. משתמש מזין אימייל + סיסמה בדף ההתחברות
                    │
                    ▼
2. Supabase Auth מאמת ומחזיר JWT Token
                    │
                    ▼
3. הטוקן נשמר ב-Client (Supabase SDK)
                    │
                    ▼
4. כל קריאת API שולחת: Authorization: Bearer <token>
                    │
                    ▼
5. Backend מאמת את הטוקן מול Supabase Auth endpoint
                    │
                    ▼
6. Backend בודק תפקיד המשתמש בטבלת user_roles
                    │
                    ▼
7. אם מורשה → מבצע את הפעולה
   אם לא    → מחזיר 401/403
```

### Dependencies (Middleware) של FastAPI

| Dependency | תיאור |
|---|---|
| `get_current_user` | מאמת טוקן JWT, מחזיר אובייקט משתמש (id, email, token) |
| `require_super_admin` | בודק שלמשתמש יש תפקיד `super_admin` בטבלת `user_roles` |
| `require_admin` | בודק שלמשתמש יש תפקיד `super_admin` או `organization_admin` |

### Row Level Security (RLS)

מדיניות אבטחה ברמת מסד הנתונים:
- כל שאילתה עוברת דרך מדיניות RLS
- ארגון יכול לראות/לערוך רק את הנתונים שלו
- Super Admin עובר דרך `supabase_admin` (Service Role Key) שעוקף RLS

### יומן פעילות (Activity Logging)

כל פעולה משמעותית נרשמת אוטומטית:
- יצירת/עדכון/מחיקת ארגון
- הזמנת/מחיקת משתמש
- שינויים בהגדרות

הלוג כולל: מי (user_id), מה (action_type), על מה (entity_type, entity_id), מתי (created_at), ופרטים נוספים (details).

---

## 9. מודולים עיקריים

### 9.1 מודול ניהול ארגונים

**מה עושה:** מאפשר ל-Super Admin ליצור ולנהל ארגונים.

**תהליך יצירת ארגון:**
1. Super Admin ממלא טופס (שם, אימייל, טלפון, רמת מנוי)
2. המערכת מייצרת `org_number` אוטומטי (5 ספרות)
3. הארגון נוצר במסד הנתונים
4. הפעולה נרשמת ביומן הפעילות
5. ניתן להגדיר מבנה היררכי דרך Setup Wizard

**Setup Wizard (אשף הגדרת מבנה):**
- בחירת רמות היררכיה (אגף → מחלקה → תת-מחלקה)
- אפשרות לנעילת הקונפיגורציה (מונע שינויים עתידיים)

### 9.2 מודול ניהול עובדים (בסגנון חילן)

**מה עושה:** מנהל תיקי עובדים עם מעקב מלא אחר כל שינוי.

**מערכת אירועים (Event-Based):**

במקום לעדכן ישירות את רשומת העובד, כל שינוי נשמר כ"אירוע" חדש. זה מאפשר:
- **היסטוריה מלאה** - לראות את כל השינויים שנעשו לעובד
- **מכונת זמן** - לצפות בנתוני העובד כפי שהיו בתאריך מסוים
- **ביקורת** - לדעת מי שינה מה ומתי

**טבלאות אירועים (Table System):**

| טבלה | קוד | תחום |
|---|---|---|
| Table 001 | 200 | פרטים אישיים (שם, ת.ז., תאריך לידה) |
| Table 101 | 101 | כתובת (עיר, רחוב, מיקוד) |

**דוגמה:** כשמעדכנים כתובת של עובד, המערכת לא מוחקת את הכתובת הישנה אלא יוצרת אירוע חדש עם `effective_from` שמסמן מתי הכתובת החדשה נכנסת לתוקף.

### 9.3 מודול מבנה ארגוני

**מה עושה:** מגדיר את ההיררכיה הארגונית.

**מבנה עצי:**
```
ארגון
├── אגף טכנולוגיה
│   ├── מחלקת פיתוח
│   │   ├── צוות Frontend
│   │   └── צוות Backend
│   └── מחלקת QA
└── אגף כספים
    ├── מחלקת חשבונאות
    └── מחלקת תקציבים
```

- כל יחידה (`org_unit`) יכולה להכיל יחידות ילד
- לכל יחידה אפשר להגדיר מנהל
- הרמות מוגדרות ב-Setup Wizard של הארגון

### 9.4 מודול דשבורד וניתוחים

**דשבורד Super Admin:**
- **סה"כ ארגונים** - מונה כל הארגונים
- **ארגונים פעילים** - מונה ארגונים עם `is_active = true`
- **MRR (Monthly Recurring Revenue)** - הכנסה חודשית חוזרת, סכום כל ה-`subscription_amount`
- **פעילות אחרונה** - 5 הארגונים האחרונים שנוצרו

**ניתוחים:**
- גרף צמיחה (6 חודשים אחרונים)
- גרף עוגה - התפלגות מנויים (Basic, Pro, Enterprise)
- שיעור נטישה (Churn Rate)

**ייצוא:**
- ייצוא רשימת ארגונים ל-CSV
- ייצוא טבלאות ל-Excel (XLSX) מצד הלקוח

### 9.5 מודול הודעות מערכת

**מה עושה:** מאפשר ל-Super Admin לשלוח הודעות לכל המשתמשים או לארגונים ספציפיים.

**סוגי הודעות:**
| סוג | שימוש |
|---|---|
| `info` | מידע כללי |
| `warning` | אזהרה |
| `success` | הצלחה |
| `update` | עדכון מערכת |

**ממיקוד:**
- `all` - לכל הארגונים
- `specific` - לארגונים נבחרים בלבד

### 9.6 מודול משימות מנהל

**מה עושה:** רשימת משימות פנימית ל-Super Admin.

- יצירת משימות עם כותרת, תיאור, עדיפות ותאריך יעד
- הקצאת משימות למשתמש
- מעקב סטטוס (פתוח, בטיפול, הושלם)

---

## 10. תהליכי עבודה מרכזיים

### 10.1 הזרימה הכללית של בקשת API

```
Client (Browser)
    │
    │  HTTP Request + Bearer Token
    ▼
Next.js (rewrite /api → localhost:8000/api)
    │
    ▼
FastAPI Router
    │
    ├── get_current_user()  ← מאמת טוקן מול Supabase Auth
    │
    ├── require_super_admin()  ← בודק תפקיד (אם נדרש)
    │
    ├── Business Logic  ← לוגיקה עסקית
    │
    ├── Supabase SDK  ← גישה למסד נתונים
    │
    ├── log_activity()  ← רישום ביומן
    │
    └── JSON Response  ← תשובה ללקוח
```

### 10.2 תהליך יצירת עובד

```
1. משתמש ממלא טופס "עובד חדש" (Table 001)
                    │
                    ▼
2. Frontend שולח POST עם:
   {
     operation_code: "ADD",
     event_code: "200",
     data: { employee_number, id_number, first_name_he, ... }
   }
                    │
                    ▼
3. Backend ממפה operation_code: "ADD" → " " (רווח)
                    │
                    ▼
4. Backend קורא ל-Supabase RPC: create_employee_event()
                    │
                    ▼
5. הפונקציה ב-PostgreSQL:
   a. יוצרת רשומה בטבלת employees (אם חדש)
   b. יוצרת אירוע בטבלת employee_events
   c. מעדכנת שדות רלוונטיים בטבלת employees
                    │
                    ▼
6. תשובה חוזרת ללקוח עם אישור
```

### 10.3 תהליך החלפת ארגון

```
1. Super Admin לוחץ על בורר ארגונים (Header)
                    │
                    ▼
2. OrganizationContext מעדכן את currentOrg
                    │
                    ▼
3. הבחירה נשמרת ב-localStorage (selectedOrgId)
                    │
                    ▼
4. כל הקומפוננטות שתלויות בארגון מתרעננות
                    │
                    ▼
5. קריאות API חדשות עם org_id המעודכן
```

---

## 11. עיצוב ו-UI

### פלטת צבעים

| משתנה CSS | ערך | שימוש |
|---|---|---|
| `--primary` | `#00A896` | צבע ראשי (Teal) - כפתורים, קישורים |
| `--secondary` | `#2C3E50` | צבע משני - כותרות, רקע Sidebar |
| `--text-primary` | `#2C3E50` | טקסט ראשי |
| `--text-secondary` | `#7F8C8D` | טקסט משני |
| `--text-muted` | `#95A5A6` | טקסט מעומעם |
| `--bg-main` | `#ECF0F1` | רקע ראשי |
| `--surface` | `#ffffff` | רקע כרטיסים |
| `--border` | `#BDC3C7` | גבולות |
| `--success` | `#27AE60` | הצלחה (ירוק) |
| `--warning` | `#F39C12` | אזהרה (כתום) |
| `--danger` | `#C0392B` | שגיאה/מחיקה (אדום) |
| `--info` | `#2980B9` | מידע (כחול) |

### גופן

- **Rubik** (Google Fonts) - גופן שתומך בעברית ובאנגלית
- נטען דרך `next/font/google`

### RTL (כתיבה מימין לשמאל)

- `direction: rtl` מוגדר ב-CSS הגלובלי
- תוסף `tailwindcss-rtl` מוסיף מחלקות RTL ל-Tailwind
- כל הקומפוננטות מיושרות מימין

### ספריית קומפוננטות

| קומפוננטה | ספרייה | תיאור |
|---|---|---|
| Button, Card, Input | Custom + Tailwind | קומפוננטות בסיס מעוצבות |
| Modal | Custom | דיאלוגים |
| Avatar | Radix UI | תמונות פרופיל |
| Select | Radix UI | בחירה מרשימה |
| Tabs | Radix UI | טאבים |
| Table | TanStack + Custom | טבלאות נתונים |
| Calendar | react-day-picker | בחירת תאריכים |
| Toast | react-hot-toast | התראות |
| Charts | Recharts | גרפים |

---

## 12. התקנה והרצה

### דרישות מקדימות

- **Python** 3.12+
- **Node.js** 18+
- **npm** 9+
- חשבון **Supabase** (עם פרויקט מוגדר)

### התקנה מהירה

```bash
# שיבוט הפרויקט
git clone <repo-url>
cd ClickDev

# התקנת הכל בפקודה אחת
npm run install:all
```

### הרצה (שני השרתים במקביל)

```bash
npm run dev
```

זה מריץ במקביל:
- **Frontend** על `http://localhost:3000`
- **Backend** על `http://localhost:8000`

### הרצה נפרדת

```bash
# Backend בלבד
npm run dev:backend
# או:
cd backend && python -m uvicorn main:app --reload

# Frontend בלבד
npm run dev:frontend
# או:
cd frontend && npm run dev
```

### Build

```bash
npm run build:frontend
```

### Lint

```bash
npm run lint:frontend
```

---

## 13. משתני סביבה

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://xxxxx.supabase.co       # כתובת Supabase
SUPABASE_API_KEY=eyJ...                       # Anon Key (ציבורי)
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # Service Role Key (סודי!)
API_PORT=8000                                 # פורט השרת
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co    # כתובת Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                  # Anon Key (ציבורי)
```

### הערות אבטחה

- `SUPABASE_SERVICE_ROLE_KEY` הוא מפתח בעל הרשאות מלאות שעוקף RLS - **חייב להישאר בצד השרת בלבד**
- `NEXT_PUBLIC_*` - משתנים אלו חשופים לצד הלקוח, לכן מכילים רק מפתחות ציבוריים
- קובצי `.env` לא נשמרים ב-Git (מוגדרים ב-`.gitignore`)

---

## נספח: תרשים ישויות ויחסים (ER)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ organizations│──┐    │  user_roles   │    ┌──│  auth.users  │
│              │  │    │              │    │  │  (Supabase)  │
│ id           │  │    │ user_id    ──┼────┘  │              │
│ name         │  ├────┤ org_id     ──┤       │ id           │
│ org_number   │  │    │ role         │       │ email        │
│ ...          │  │    └──────────────┘       └──────────────┘
└──────┬───────┘  │
       │          │    ┌──────────────┐
       │          ├────┤  employees   │
       │          │    │              │
       │          │    │ org_id     ──┤
       │          │    │ employee_num │
       │          │    │ id_number    │
       │          │    │ first_name_he│
       │          │    │ ...          │
       │          │    └──────┬───────┘
       │          │           │
       │          │    ┌──────┴───────┐
       │          │    │employee_events│
       │          │    │              │
       │          │    │ employee_id  │
       │          │    │ event_code   │
       │          │    │ operation_code│
       │          │    │ event_data   │
       │          │    │ effective_from│
       │          │    └──────────────┘
       │          │
       │          │    ┌──────────────┐
       │          ├────┤  org_units   │◄─── parent_id (self-reference)
       │          │    │              │
       │          │    │ org_id       │
       │          │    │ name         │
       │          │    │ type         │
       │          │    │ parent_id    │
       │          │    └──────┬───────┘
       │          │           │
       │          │    ┌──────┴───────┐
       │          ├────┤  positions   │
       │          │    │              │
       │          │    │ org_id       │
       │          │    │ org_unit_id  │
       │          │    │ job_title_id │
       │          │    │ occupant_id  │
       │          │    └──────────────┘
       │          │
       │          │    ┌──────────────┐     ┌──────────────┐
       │          ├────┤  job_grades  │◄────┤  job_titles  │
       │          │    │              │     │              │
       │          │    │ org_id       │     │ org_id       │
       │          │    │ name         │     │ title        │
       │          │    │ level        │     │ default_grade│
       │          │    └──────────────┘     └──────────────┘
       │          │
       │          │    ┌──────────────┐
       │          ├────┤announcements │
       │          │    │              │
       │          │    │ title        │
       │          │    │ content      │
       │          │    │ type         │
       │          │    │ target_type  │
       │          │    └──────────────┘
       │          │
       │          │    ┌──────────────────┐
       │          └────┤user_activity_logs│
       │               │                 │
       │               │ user_id         │
       │               │ action_type     │
       │               │ entity_type     │
       │               │ details (JSONB) │
       │               └─────────────────┘
       │
       │          ┌──────────────┐
       └──────────┤ admin_tasks  │
                  │              │
                  │ title        │
                  │ priority     │
                  │ status       │
                  │ assigned_to  │
                  └──────────────┘
```

---

*מסמך זה נוצר אוטומטית מתוך קריאת קוד המקור של פרויקט CLICK.*
*תאריך עדכון אחרון: פברואר 2026*
