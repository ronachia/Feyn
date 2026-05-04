-- FeynLearn Supabase Schema
-- Execute este SQL no SQL Editor do seu projeto Supabase

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  goal text,
  level text,
  language text default 'en',
  onboarded_at timestamptz,
  placement_sub_level text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);


-- ── Progress ──────────────────────────────────────────────────────────────────
create table if not exists progress (
  id uuid references auth.users on delete cascade primary key,
  xp int default 0,
  streak int default 0,
  last_session_date text,
  completed_lessons jsonb default '[]',
  gaps jsonb default '[]',
  session_history jsonb default '[]',
  earned_badges jsonb default '[]',
  no_peek_count int default 0,
  high_clarity_count int default 0,
  fixed_gaps int default 0,
  daily_stats jsonb default '{"date":null,"aiCalls":0}',
  custom_lessons jsonb default '[]',
  updated_at timestamptz default now()
);

alter table progress enable row level security;

drop policy if exists "Users can read own progress" on progress;
drop policy if exists "Users can insert own progress" on progress;
drop policy if exists "Users can update own progress" on progress;

create policy "Users can read own progress"
  on progress for select using (auth.uid() = id);

create policy "Users can insert own progress"
  on progress for insert with check (auth.uid() = id);

create policy "Users can update own progress"
  on progress for update using (auth.uid() = id);

-- ── Migrations (safe to run on existing DB) ───────────────────────────────────
alter table profiles add column if not exists placement_sub_level text;
