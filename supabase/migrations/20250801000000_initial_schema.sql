-- FeynLearn Supabase Schema
-- Auth: Clerk (not Supabase Auth). All DB access via Edge Functions + service role key.

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  clerk_user_id   text primary key,
  goal            text,
  level           text,
  language        text default 'en',
  onboarded_at    timestamptz,
  placement_sub_level text,
  is_premium      bool default false,
  created_at      timestamptz default now()
);

-- ── Progress ──────────────────────────────────────────────────────────────────
create table if not exists progress (
  clerk_user_id       text primary key references profiles(clerk_user_id) on delete cascade,
  xp                  int default 0,
  streak              int default 0,
  last_session_date   text,
  completed_lessons   jsonb default '[]',
  gaps                jsonb default '[]',
  session_history     jsonb default '[]',
  earned_badges       jsonb default '[]',
  no_peek_count       int default 0,
  high_clarity_count  int default 0,
  fixed_gaps          int default 0,
  daily_stats         jsonb default '{"date":null,"aiCalls":0}',
  custom_lessons      jsonb default '[]',
  updated_at          timestamptz default now()
);

-- ── Migrations (safe to run on existing DB) ───────────────────────────────────
alter table profiles add column if not exists placement_sub_level text;
alter table profiles add column if not exists is_premium bool default false;
alter table profiles add column if not exists premium_plan text; -- 'monthly' or 'yearly'
alter table profiles add column if not exists premium_started_at timestamptz;
alter table profiles add column if not exists premium_expires_at timestamptz;
alter table profiles add column if not exists premium_cancelled_at timestamptz;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- As Edge Functions usam SUPABASE_SERVICE_ROLE_KEY (bypassa RLS automaticamente).
-- O SUPABASE_ANON_KEY é exposto no bundle do frontend — RLS bloqueia acesso direto.

alter table profiles enable row level security;
alter table progress enable row level security;

-- Bloquear todo acesso direto via anon key / client-side
-- Acesso legítimo ocorre APENAS via Edge Functions com service_role
create policy if not exists "deny_direct_profiles" on profiles
  for all using (false);

create policy if not exists "deny_direct_progress" on progress
  for all using (false);

-- ── Índices de Performance ────────────────────────────────────────────────────
create index if not exists idx_profiles_is_premium on profiles(is_premium);
create index if not exists idx_profiles_premium_expires on profiles(premium_expires_at)
  where is_premium = true;
