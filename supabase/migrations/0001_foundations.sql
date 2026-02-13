-- 0001_foundations.sql
-- Foundations: orgs, memberships, module flags, system admins, RLS (deny-by-default).

begin;

create extension if not exists pgcrypto;

-- 1) organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- 2) org_members
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- 3) modules
create table if not exists public.modules (
  key text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- 4) org_modules
create table if not exists public.org_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null references public.modules(key),
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, module_key),
  constraint core_always_enabled check (module_key <> 'core' or is_enabled = true)
);

-- 5) system_admins
create table if not exists public.system_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

-- Helper functions used in RLS (SECURITY DEFINER to avoid dependency on RLS policies).
create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.system_admins sa
    where sa.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.org_members m
    where m.user_id = auth.uid()
      and m.org_id = _org_id
  );
$$;

-- Auto-seed core module enabled for every new org (defense-in-depth; API also enforces).
create or replace function public._org_modules_seed_core()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_modules (org_id, module_key, is_enabled)
  values (new.id, 'core', true)
  on conflict (org_id, module_key)
  do update set is_enabled = true;
  return new;
end;
$$;

drop trigger if exists organizations_seed_core on public.organizations;
create trigger organizations_seed_core
after insert on public.organizations
for each row execute function public._org_modules_seed_core();

-- Seed modules catalog
insert into public.modules (key, name)
values
  ('core', 'Core'),
  ('flow', 'Flow'),
  ('docs', 'Docs'),
  ('assets', 'Assets'),
  ('vibe', 'Vibe'),
  ('grow', 'Grow'),
  ('vision', 'Vision'),
  ('insights', 'Insights')
on conflict (key) do nothing;

-- RLS: deny-by-default (no policies) then allow explicit policies.
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.modules enable row level security;
alter table public.org_modules enable row level security;
alter table public.system_admins enable row level security;

-- System admin: full access
create policy organizations_system_admin_all
on public.organizations
for all
using (public.is_system_admin())
with check (public.is_system_admin());

create policy org_members_system_admin_all
on public.org_members
for all
using (public.is_system_admin())
with check (public.is_system_admin());

create policy modules_system_admin_all
on public.modules
for all
using (public.is_system_admin())
with check (public.is_system_admin());

create policy org_modules_system_admin_all
on public.org_modules
for all
using (public.is_system_admin())
with check (public.is_system_admin());

create policy system_admins_system_admin_all
on public.system_admins
for all
using (public.is_system_admin())
with check (public.is_system_admin());

-- Normal users: SELECT only where member.
create policy organizations_member_select
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

create policy org_members_member_select
on public.org_members
for select
to authenticated
using (public.is_org_member(org_id));

create policy org_modules_member_select
on public.org_modules
for select
to authenticated
using (public.is_org_member(org_id));

-- Modules catalog is not tenant data; allow authenticated users to read it.
create policy modules_authenticated_select
on public.modules
for select
to authenticated
using (true);

commit;

