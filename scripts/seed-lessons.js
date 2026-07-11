/**
 * seed-lessons.js
 * Migra as lições de src/data/lessons.js para a tabela `lessons` no Supabase.
 *
 * Uso:
 *   node scripts/seed-lessons.js
 *
 * Variáveis necessárias (pode usar .env ou exportar no terminal):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Carregar .env e .env.local (sem dependência extra)
for (const filename of ['.env', '.env.local']) {
  try {
    const envFile = readFileSync(path.resolve(__dirname, '..', filename), 'utf8')
    for (const line of envFile.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length && !key.startsWith('#')) {
        process.env[key.trim()] = rest.join('=').trim()
      }
    }
  } catch {}
}

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltam variáveis: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Importar lições (ESM)
const lessonsPath = pathToFileURL(path.resolve(__dirname, '../src/data/lessons.js')).href
const { lessons } = await import(lessonsPath)

function slugify(title, subLevel) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + subLevel
}

async function upsertLesson(lesson) {
  const body = {
    id:                lesson.id,
    slug:              slugify(lesson.title, lesson.subLevel),
    title:             lesson.title,
    level:             lesson.level,
    sub_level:         lesson.subLevel,
    category:          lesson.category ?? null,
    icon:              lesson.icon ?? '📖',
    type:              lesson.type ?? 'text',
    estimated_minutes: lesson.estimatedMinutes ?? 15,
    content:           lesson.content ?? null,
    key_points:        lesson.keyPoints ?? [],
    vocabulary:        lesson.vocabulary ?? [],
    video_url:         lesson.videoUrl ?? null,
    audio_url:         lesson.audioUrl ?? null,
    is_active:         true,
    sort_order:        lesson.id,
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/lessons`, {
    method: 'POST',
    headers: {
      'apikey':        SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Lesson ${lesson.id} "${lesson.title}": ${err}`)
  }
}

console.log(`\n🌱  Iniciando seed de ${lessons.length} lições...\n`)

let ok = 0
let failed = 0

for (const lesson of lessons) {
  try {
    await upsertLesson(lesson)
    console.log(`  ✅  [${lesson.id}] ${lesson.title} (${lesson.subLevel})`)
    ok++
  } catch (err) {
    console.error(`  ❌  [${lesson.id}] ${lesson.title}: ${err.message}`)
    failed++
  }
}

console.log(`\n✨  Seed completo: ${ok} inseridas, ${failed} falhas.\n`)
