-- ── Lessons Table ─────────────────────────────────────────────────────────────
-- Conteúdo de lições migrado de lessons.js para o banco.
-- Permite edição sem deploy via painel admin.

CREATE TABLE IF NOT EXISTS lessons (
  id                serial PRIMARY KEY,
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  level             text NOT NULL,              -- 'beginner' | 'intermediate' | 'advanced'
  sub_level         text NOT NULL,              -- 'a1' | 'a2' | ... | 'c3'
  category          text,
  icon              text DEFAULT '📖',
  type              text DEFAULT 'text',        -- 'text' | 'video' | 'audio'
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

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Lições são conteúdo público — leitura liberada para anon + authenticated.
-- Escrita bloqueada para todos (só via Edge Function com service_role).

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "lessons_public_read" ON lessons
  FOR SELECT USING (is_active = true);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lessons_sub_level ON lessons(sub_level, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_level     ON lessons(level, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_active    ON lessons(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_slug      ON lessons(slug);

-- ── Trigger: updated_at automático ────────────────────────────────────────────
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

-- ── Coluna is_admin em profiles (para painel admin) ───────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin bool DEFAULT false;
