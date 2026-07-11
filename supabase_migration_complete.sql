-- ═══════════════════════════════════════════════════════════════════════════════
-- FEYNLEARN — MIGRATION COMPLETA
-- Execute este arquivo no SQL Editor do Supabase em uma única operação.
-- Dashboard → SQL Editor → New Query → Cole tudo → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Coluna is_admin em profiles ───────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin bool DEFAULT false;

-- ── 2. Tabela lessons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id                serial PRIMARY KEY,
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  level             text NOT NULL,
  sub_level         text NOT NULL,
  category          text,
  icon              text DEFAULT '📖',
  type              text DEFAULT 'text',
  estimated_minutes int  DEFAULT 15,
  content           text,
  key_points        jsonb DEFAULT '[]',
  vocabulary        jsonb DEFAULT '[]',
  video_url         text,
  audio_url         text,
  is_active         bool DEFAULT true,
  sort_order        int  DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_public_read" ON lessons;
CREATE POLICY "lessons_public_read" ON lessons
  FOR SELECT USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_lessons_sub_level ON lessons(sub_level, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_level     ON lessons(level, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_active    ON lessons(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_slug      ON lessons(slug);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 3. Tabela analytics_events ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id            bigserial PRIMARY KEY,
  clerk_user_id text,
  event_name    text        NOT NULL,
  properties    jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_direct_analytics" ON analytics_events;
CREATE POLICY "deny_direct_analytics" ON analytics_events
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user       ON analytics_events(clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created    ON analytics_events(created_at DESC);

-- ── 4. Ativar seu usuário como admin ─────────────────────────────────────────
-- Substitua 'SEU_CLERK_USER_ID' pelo seu ID do Clerk
-- (aparece no Clerk Dashboard → Users → seu usuário → User ID: user_xxx)
-- UPDATE profiles SET is_admin = true WHERE clerk_user_id = 'user_xxx';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- Próximo passo: rodar o seed de lições
--   1. Adicione SUPABASE_SERVICE_ROLE_KEY no arquivo .env
--      (Supabase Dashboard → Project Settings → API → service_role key)
--   2. node scripts/seed-lessons.js
-- ═══════════════════════════════════════════════════════════════════════════════
