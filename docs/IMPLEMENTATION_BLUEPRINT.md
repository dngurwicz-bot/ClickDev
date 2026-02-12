# CLICK System Blueprint - Implementation Guide

מסמך זה מתאר את מימוש ה-System Blueprint כמערכת דינמית מלאה (DB-first) על בסיס Supabase + FastAPI + Next.js.

## מה מומש

### Backend
- API ציבורי:
  - `GET /api/system-blueprint` מחזיר גרסה מפורסמת מתוך DB.
  - `GET /api/system-blueprint/versions` מחזיר רשימת גרסאות.
- API ניהולי מאובטח (`super_admin` בלבד):
  - `POST/PUT /api/admin/system-blueprint/versions`
  - `POST /api/admin/system-blueprint/versions/{version_id}/publish`
  - CRUD ל:
    - `modules`
    - `phases`
    - `phase-deliverables`
    - `notification-channels`
    - `alert-engines`
    - `alert-examples`
    - `core-entities`
    - `integration-targets`
    - `target-companies`
    - `module-capabilities`
    - `module-kpis`
    - `escalation-policies`
  - `GET /api/admin/system-blueprint/versions/{version_id}/full` לעריכה מרוכזת.
- ולידציות publish:
  - אין publish בלי meta תקין.
  - אין publish בלי modules.
  - `display_order` מודולים חייב להיות רציף `1..N`.
  - אין publish בלי phases.
  - אין publish בלי channels + engines + escalation policy.

### Database (Supabase)
- Migration חדש: `supabase/migrations/037_system_blueprint.sql`
- נוספו 13 טבלאות Blueprint מנורמלות עם:
  - FK + cascade
  - unique constraints לסדרים
  - RLS enabled לכל הטבלאות
  - מדיניות קריאה ציבורית רק לגרסאות `is_published=true`
  - ניהול כתיבה רק ל-`super_admin`
  - טריגרים לעדכון `updated_at` בטבלאות הראשיות

### Seed Data
- סקריפט: `backend/scripts/seed_system_blueprint.py`
- מזין את כל התוכן המקצועי:
  - 8 מודולים
  - שלבי הטמעה + deliverables
  - Smart Notifications (channels, engines, examples, escalation)
  - Core entities
  - Integration targets
- מפרסם אוטומטית את גרסת `3.0` בסיום ה-seed.

### Frontend
- עמוד ציבורי: `frontend/app/system-blueprint/page.tsx`
  - טעינה מ-API בלבד כמקור ראשי.
  - fallback רק בסביבת פיתוח.
  - הודעת שגיאה ברורה במקרה כשל.
- עמוד ניהול: `frontend/app/admin/system-blueprint/page.tsx`
  - יצירת גרסה, עדכון גרסה, פרסום גרסה.
  - הוספה/מחיקה של מודולים, שלבים, ערוצים, ישויות, אינטגרציות.
  - טעינת payload מלא של גרסה לעריכה.
- ניווט:
  - קישור ציבורי ל-`/system-blueprint`
  - קישור Admin ל-`/admin/system-blueprint`

## איך להריץ

1. Apply migration `037_system_blueprint.sql` ב-Supabase.
   - להרצה אוטומטית מהפרויקט: נדרש `DATABASE_URL` ב-`backend/.env`.
   - פקודה: `python scripts/apply_db.py`
2. להריץ seed:
   - `cd backend`
   - `python scripts/seed_system_blueprint.py`
3. להריץ backend:
   - `python main.py`
4. להריץ frontend:
   - `cd ../frontend`
   - `npm install`
   - `npm run dev`
5. בדיקה:
   - ציבורי: `http://localhost:3000/system-blueprint`
   - API: `http://localhost:8000/api/system-blueprint`
   - Admin: `http://localhost:3000/admin/system-blueprint`

## קריטריוני הצלחה ממומשים
- אין hardcoded business payload ב-endpoint הציבורי.
- תוכן Blueprint מנוהל מתוך DB.
- קיימת יכולת ניהול תוכן דרך Admin.
- payload ציבורי נשאר תואם מבנה `BlueprintPayload`.
