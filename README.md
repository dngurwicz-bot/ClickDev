# Multi-Tenant HR SaaS (Next.js + Supabase + FastAPI)

## Stack
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS
- Auth/DB: Supabase (Postgres + Supabase Auth + RLS)
- Privileged API: Python FastAPI (server-only service role key)

## Brand Palette (Auto-Extracted)
Extracted by `tools/extract_brand_palette.py` into `tools/brand_palette.json`.

- Source files:
  - `frontend/app/icon.png`

- Tokens (light mode):
  - `--brand-primary`: `#25618D`
  - `--brand-secondary`: `#1B5077`
  - `--brand-accent`: `#1A4E76`
  - `--brand-bg`: `#E2EAED`
  - `--brand-surface`: `#FEFEFE`
  - `--brand-text`: `#113F61`

UI token wiring:
- `frontend/app/globals.css` defines CSS variables (+ `.dark` overrides).
- `frontend/tailwind.config.ts` maps Tailwind colors to the CSS variables (e.g. `bg-brand-primary`).

Brand preview (Super Admin only):
- `http://localhost:3000/app/admin/brand`

## Supabase Migrations
Migration:
- `supabase/migrations/0001_foundations.sql`

Tables:
- `organizations`
- `org_members`
- `modules`
- `org_modules` (with `core` locked ON via DB constraint + auto-seed trigger)
- `system_admins`

RLS:
- Enabled on all tables.
- Deny-by-default, then allow:
  - system admin: full access on all foundation tables
  - members: SELECT only within their org
  - modules catalog: SELECT for authenticated users

## Backend (FastAPI)
Server-only env vars (never in browser):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

Endpoints:
- `GET /me`
- Admin (System Super Admin):
  - `POST /admin/orgs`
  - `GET /admin/orgs`
  - `PATCH /admin/orgs/{org_id}`
  - `GET /admin/orgs/{org_id}/members`
  - `POST /admin/orgs/{org_id}/members`
  - `PATCH /admin/orgs/{org_id}/members/{member_id}`
  - `DELETE /admin/orgs/{org_id}/members/{member_id}`
  - `GET /admin/orgs/{org_id}/modules`
  - `PATCH /admin/orgs/{org_id}/modules` (core locked ON)
- Org-scoped:
  - `GET /org/modules`
  - `GET /org/members` (requires `org_admin`)

Auth:
- Every endpoint requires `Authorization: Bearer <Supabase JWT>` and verifies via `SUPABASE_JWT_SECRET`.

## Frontend (Next.js)
Browser env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL` (FastAPI base URL)

Routes:
- `/login`
- `/app` (authenticated shell)
- `/app/admin/orgs` (System Super Admin)
- `/app/admin/brand` (System Super Admin)

## Dev Run
1. Install
```bash
npm run install:all
```

2. Configure env
- Backend: copy `backend/.env.example` to `backend/.env`
- Frontend: copy `frontend/.env.example` to `frontend/.env.local`

3. Run
```bash
npm run dev
```

## Bootstrap: Create First System Admin
After you create a Supabase Auth user (email/password), insert that user id into `system_admins`:

```sql
insert into public.system_admins (user_id) values ('<auth.users.id>');
```

Security note: the service role key must only exist on the FastAPI server (never in Next.js / browser).

