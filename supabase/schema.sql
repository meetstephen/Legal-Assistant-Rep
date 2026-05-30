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

-- 3) Row Level Security: a user can only see and change their own row.
alter table public.workspaces enable row level security;

drop policy if exists "own workspace - select" on public.workspaces;
create policy "own workspace - select" on public.workspaces
  for select using (auth.uid() = user_id);

drop policy if exists "own workspace - insert" on public.workspaces;
create policy "own workspace - insert" on public.workspaces
  for insert with check (auth.uid() = user_id);

drop policy if exists "own workspace - update" on public.workspaces;
create policy "own workspace - update" on public.workspaces
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
