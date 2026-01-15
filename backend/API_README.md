# CLICK HR Platform - FastAPI Backend

## התקנה והרצה

### 1. התקנת תלויות
```bash
pip install -r requirements.txt
```

### 2. הגדרת משתני סביבה
ודא שיש לך קובץ `.env.local` עם:
```
NEXT_PUBLIC_SUPABASE_URL=https://zojunaebbtymllsaqlme.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. הרצת השרת
```bash
python run_api.py
```

השרת ירוץ על `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - התחברות
- `POST /api/auth/logout` - התנתקות

### Organizations
- `GET /api/organizations` - קבלת כל הארגונים
- `GET /api/organizations/{org_id}` - קבלת ארגון לפי ID
- `POST /api/organizations` - יצירת ארגון חדש
- `PUT /api/organizations/{org_id}` - עדכון ארגון
- `DELETE /api/organizations/{org_id}` - מחיקת ארגון

### Employees
- `GET /api/employees?organization_id={org_id}` - קבלת עובדים (אופציונלי: סינון לפי ארגון)
- `GET /api/employees/{employee_id}` - קבלת עובד לפי ID
- `POST /api/employees` - יצירת עובד חדש
- `PUT /api/employees/{employee_id}` - עדכון עובד (שומר היסטוריה אוטומטית)
- `DELETE /api/employees/{employee_id}` - מחיקת עובד

### Job History
- `GET /api/job-history?employee_id={emp_id}` - קבלת היסטוריית עבודה
- `GET /api/job-history/employee/{employee_id}` - היסטוריה מלאה של עובד
- `GET /api/job-history/{history_id}` - קבלת רשומת היסטוריה ספציפית

## מבנה הפרויקט

```
api/
├── __init__.py
├── main.py              # FastAPI app main
├── config.py            # הגדרות Supabase
├── database.py          # Supabase client
├── models.py            # Pydantic models
└── routers/
    ├── __init__.py
    ├── auth.py          # Authentication routes
    ├── organizations.py # Organization routes
    ├── employees.py     # Employee routes
    └── job_history.py   # Job history routes
```

## תכונות מיוחדות

- **Time Machine**: כאשר מעדכנים עובד, הנתונים הישנים נשמרים אוטומטית ב-`job_history` דרך trigger ב-SQL
- **Multi-Tenancy**: תמיכה מלאה בארגונים מרובים
- **CORS**: מוגדר לתמיכה ב-Next.js frontend

## API Documentation

לאחר הרצת השרת, תוכל לגשת ל-Swagger UI ב:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`
