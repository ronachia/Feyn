/**
 * useLessons — carrega lições do Supabase com cache em 2 camadas:
 *   1. Zustand (in-memory, zero latência durante a sessão)
 *   2. localStorage (24h TTL, evita request ao abrir o app)
 *
 * Lições são conteúdo público — acessadas via REST + anon key (sem Edge Function).
 */

import { useState, useEffect } from 'react'
import { create } from 'zustand'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CACHE_KEY         = 'feyn_lessons_cache'
const CACHE_TTL_MS      = 24 * 60 * 60 * 1000 // 24 horas

// ── Store global (Zustand) ────────────────────────────────────────────────────
const useLessonsStore = create((set, get) => ({
  lessons:  [],
  loading:  false,
  error:    null,
  fetched:  false,

  setLessons: (lessons) => set({ lessons, fetched: true, loading: false, error: null }),
  setLoading:  (v) => set({ loading: v }),
  setError:    (e) => set({ error: e, loading: false }),
}))

// ── Cache helpers ─────────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, cachedAt } = JSON.parse(raw)
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {}
}

export function invalidateLessonsCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
  useLessonsStore.setState({ lessons: [], fetched: false })
}

// ── Fetch do Supabase ─────────────────────────────────────────────────────────
async function fetchLessons() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lessons?is_active=eq.true&order=sort_order.asc`,
    {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept':        'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(`Failed to load lessons: ${res.status}`)
  return res.json()
}

// ── Normalizar campos do banco para o formato esperado pelo app ───────────────
function normalize(row) {
  return {
    id:               row.id,
    slug:             row.slug,
    title:            row.title,
    level:            row.level,
    subLevel:         row.sub_level,
    category:         row.category,
    icon:             row.icon ?? '📖',
    type:             row.type ?? 'text',
    estimatedMinutes: row.estimated_minutes ?? 15,
    content:          row.content ?? '',
    keyPoints:        row.key_points ?? [],
    vocabulary:       row.vocabulary ?? [],
    videoUrl:         row.video_url ?? null,
    audioUrl:         row.audio_url ?? null,
    isActive:         row.is_active,
    sortOrder:        row.sort_order,
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────
export default function useLessons() {
  const { lessons, loading, error, fetched, setLessons, setLoading, setError } = useLessonsStore()

  useEffect(() => {
    if (fetched || loading) return

    // 1. Tenta cache local primeiro
    const cached = readCache()
    if (cached) {
      setLessons(cached)
      return
    }

    // 2. Busca no Supabase
    setLoading(true)
    fetchLessons()
      .then((rows) => {
        const normalized = rows.map(normalize)
        writeCache(normalized)
        setLessons(normalized)
      })
      .catch((err) => {
        console.error('[useLessons]', err)
        setError(err.message)
      })
  }, [fetched, loading])

  return {
    lessons,
    loading,
    error,
    getLessonById:    (id) => lessons.find((l) => l.id === Number(id)),
    getLessonsByLevel:(level) => lessons.filter((l) => l.level === level),
    getLessonBySlug:  (slug) => lessons.find((l) => l.slug === slug),
  }
}
