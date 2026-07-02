-- ============================================================
-- LexiAssist 2.0 — Supabase schema (optional cloud persistence)
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- It creates a per-user workspace store protected by Row Level Security so
-- each authenticated lawyer can only ever read/write their OWN data.
--
-- Model: the app keeps its workspace as a set of JSON slices (cases, clients,
-- tasks, etc.). We store them as one JSONB row per user, which mirrors the
-- app's existing storage contract and needs no schema change as features grow.
--
-- Idempotent: every statement uses if-not-exists / drop-then-create, so this
-- file is safe to re-run in full at any time — it will not duplicate data or
-- error on objects that already exist.
-- ============================================================

-- 1) Table: one workspace blob per authenticated user.
create table if not exists public.workspaces (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workspaces_touch on public.workspaces;
create trigger trg_workspaces_touch
  before update on public.workspaces
  for each row execute function public.touch_updated_at();

-- 3) Row Level Security: a user can only see and change their own row —
--    AND only while their account is active. This is the real data-access
--    boundary for suspension: a Supabase-banned user's existing access token
--    remains technically valid until it expires (bans block future logins/
--    refreshes, not already-issued tokens — this is documented Supabase/
--    GoTrue behaviour). Checking profiles.status here means a suspended
--    user's still-valid token cannot read or write workspace data even
--    during that window, regardless of what the client-side app does.
alter table public.workspaces enable row level security;

drop policy if exists "own workspace - select" on public.workspaces;
create policy "own workspace - select" on public.workspaces
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
    )
  );

drop policy if exists "own workspace - insert" on public.workspaces;
create policy "own workspace - insert" on public.workspaces
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
    )
  );

drop policy if exists "own workspace - update" on public.workspaces;
create policy "own workspace - update" on public.workspaces
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
    )
  );

-- 4) Optional: a firm-wide, read-only shared library of verified cases that an
--    admin can extend (everyone reads; only the service role writes).
create table if not exists public.verified_cases (
  id        bigint generated always as identity primary key,
  name      text not null,
  citation  text not null,
  court     text,
  category  text,
  holding   text,
  created_at timestamptz not null default now()
);

alter table public.verified_cases enable row level security;

drop policy if exists "verified cases - read all" on public.verified_cases;
create policy "verified cases - read all" on public.verified_cases
  for select using (true);
-- (Writes are intentionally left to the service role / SQL editor only.)

-- ============================================================
-- 5) Profiles — gives the in-app Admin dashboard real visibility into every
--    registered account, and is the source of truth for suspension status
--    (checked above by the workspaces policies, and polled client-side by
--    the app to detect a mid-session suspension).
--    Intentionally separate from `workspaces`: holds only non-sensitive
--    directory info (email, name, role, status, login times), never
--    case/client data.
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'lawyer',   -- 'lawyer' | 'admin'
  status      text not null default 'active',   -- 'active' | 'suspended'
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);

-- Auto-create a profile row the moment someone signs up via Supabase Auth.
-- SECURITY DEFINER lets this trigger write to public.profiles even though
-- the signing-up user has no profiles INSERT policy of their own.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Admin emails here MUST match VITE_ADMIN_EMAIL in Vercel. Postgres RLS
-- cannot read your Vercel env vars, so the list is duplicated. If you add
-- an admin in Vercel, add them here too (comma-separate inside the array).
--
-- IMPORTANT: this policy intentionally does NOT check status = 'active' —
-- a suspended user must still be able to read their OWN profile row so the
-- app's client-side poll can detect status = 'suspended' and force a
-- logout. Adding a status check here would make suspension undetectable.
drop policy if exists "profiles - select own or admin" on public.profiles;
create policy "profiles - select own or admin" on public.profiles
  for select using (
    auth.uid() = id
    or lower(auth.email()) = 'meetstephenoyim@gmail.com'
  );

drop policy if exists "profiles - update own or admin" on public.profiles;
create policy "profiles - update own or admin" on public.profiles
  for update using (
    auth.uid() = id
    or lower(auth.email()) = 'meetstephenoyim@gmail.com'
  );

-- Backfill: create profile rows for accounts that signed up BEFORE this
-- migration ran, so nobody is invisible to the Admin dashboard.
insert into public.profiles (id, email, name)
select id, email, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;
