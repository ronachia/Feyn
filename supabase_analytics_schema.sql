-- ── Analytics Events ──────────────────────────────────────────────────────────
-- Tabela de eventos educacionais para análise de aprendizagem.
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS analytics_events (
  id            bigserial PRIMARY KEY,
  clerk_user_id text,
  event_name    text        NOT NULL,
  properties    jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Escrita pública bloqueada (só via Edge Function com service_role)
-- Leitura bloqueada para todos (só admin via get-analytics Edge Function)
CREATE POLICY IF NOT EXISTS "deny_direct_analytics" ON analytics_events
  FOR ALL USING (false);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user      ON analytics_events(clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created   ON analytics_events(created_at DESC);
