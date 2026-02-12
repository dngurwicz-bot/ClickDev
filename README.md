# CLICK - מערכת ניהול משאבי אנוש Multi-Tenant

מערכת ניהול משאבי אנוש מלאה עם Super Admin Dashboard.

## 🏗️ מבנה הפרויקט

```
ClickDev/
├── backend/          # Python FastAPI Backend
├── frontend/         # Next.js 14 Frontend
└── supabase/         # Database Migrations
```

## 🚀 התקנה והרצה

### Backend (Python FastAPI)

```bash
cd backend
# Requires Python 3.12
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend יעלה על `http://localhost:8000`

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend יעלה על `http://localhost:3000`

## 🗄️ מסד נתונים

המיגרציות כבר הוחלו על Supabase. הטבלאות כוללות:

- `organizations` - ארגונים
- `user_roles` - תפקידי משתמשים
- `employees` - עובדים
- `employee_history` - היסטוריית שינויים
- `employee_user_mapping` - קישור עובד-משתמש

## 🔐 יצירת Super Admin

כדי ליצור משתמש Super Admin:

1. הירשם דרך Supabase Auth
2. הפעל את ה-SQL הבא ב-Supabase SQL Editor:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'super_admin');
```

## 🎨 עיצוב

המערכת משתמשת בצבעי המותג:
- Primary: #00A896 (Teal)
- Secondary: #2C3E50 (Dark blue-gray)
- Font: Rubik (תמיכה בעברית)

## 📝 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_anon_or_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgres://user:pass@host:port/postgres
API_PORT=8000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8000
BACKEND_API_URL=http://127.0.0.1:8000
```

## 🎯 Features

- ✅ Super Admin Dashboard
- ✅ ניהול ארגונים
- ✅ ניהול עובדים
- ✅ מעקב היסטוריה אוטומטי
- ✅ RLS Security
- ✅ תמיכה בעברית RTL

## 🧭 מסמך Blueprint מקצועי

נוסף עמוד ייעודי להצגת מימוש מלא של המערכת:

- Frontend: `http://localhost:3000/system-blueprint`
- Backend API: `GET /api/system-blueprint`
- Public versions: `GET /api/system-blueprint/versions`
- Admin UI: `http://localhost:3000/admin/system-blueprint`
- Documentation: `docs/IMPLEMENTATION_BLUEPRINT.md`

### טעינת נתוני Blueprint ראשונית

1. החל את המיגרציה: `supabase/migrations/037_system_blueprint.sql`
2. הרץ seed:
```bash
cd backend
python scripts/seed_system_blueprint.py
```
