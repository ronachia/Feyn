import { createClient } from 'npm:@supabase/supabase-js'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function requireAdmin(authHeader: string | null) {
  const userId = await verifyClerkJWT(authHeader)
  const { data } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single()
  if (!data?.is_admin) throw new Error('Forbidden')
  return userId
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await requireAdmin(req.headers.get('Authorization'))

    const { days = 30 } = await req.json().catch(() => ({}))
    const since = new Date(Date.now() - days * 86400000).toISOString()

    // ── Totals por evento ────────────────────────────────────────
    const { data: totals } = await supabase
      .from('analytics_events')
      .select('event_name')
      .gte('created_at', since)

    const eventCounts: Record<string, number> = {}
    for (const row of totals ?? []) {
      eventCounts[row.event_name] = (eventCounts[row.event_name] || 0) + 1
    }

    // ── DAU — usuários únicos por dia ────────────────────────────
    const { data: dauRaw } = await supabase
      .from('analytics_events')
      .select('clerk_user_id, created_at')
      .gte('created_at', since)
      .not('clerk_user_id', 'is', null)

    const dauMap: Record<string, Set<string>> = {}
    for (const row of dauRaw ?? []) {
      const day = row.created_at.slice(0, 10)
      if (!dauMap[day]) dauMap[day] = new Set()
      dauMap[day].add(row.clerk_user_id)
    }
    const dau = Object.entries(dauMap)
      .map(([date, users]) => ({ date, users: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── Top lições iniciadas ─────────────────────────────────────
    const { data: startedRaw } = await supabase
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'lesson_started')
      .gte('created_at', since)

    const lessonMap: Record<string, { title: string; started: number; completed: number }> = {}
    for (const row of startedRaw ?? []) {
      const id = row.properties?.lesson_id
      const title = row.properties?.lesson_title || `Lesson ${id}`
      if (!id) continue
      if (!lessonMap[id]) lessonMap[id] = { title, started: 0, completed: 0 }
      lessonMap[id].started++
    }

    const { data: completedRaw } = await supabase
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'lesson_completed')
      .gte('created_at', since)

    for (const row of completedRaw ?? []) {
      const id = row.properties?.lesson_id
      if (!id || !lessonMap[id]) continue
      lessonMap[id].completed++
    }

    const topLessons = Object.values(lessonMap)
      .sort((a, b) => b.started - a.started)
      .slice(0, 10)

    // ── Top gaps detectados ──────────────────────────────────────
    const { data: gapsRaw } = await supabase
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'gap_detected')
      .gte('created_at', since)

    const gapCount: Record<string, number> = {}
    for (const row of gapsRaw ?? []) {
      const g = row.properties?.gap
      if (g) gapCount[g] = (gapCount[g] || 0) + 1
    }
    const topGaps = Object.entries(gapCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([gap, count]) => ({ gap, count }))

    // ── Pass rate de análise ─────────────────────────────────────
    const passed = eventCounts['analysis_passed'] || 0
    const failed = eventCounts['analysis_failed'] || 0
    const total  = passed + failed
    const passRate = total > 0 ? Math.round((passed / total) * 100) : null

    return new Response(JSON.stringify({
      period: { days, since },
      eventCounts,
      dau,
      topLessons,
      topGaps,
      passRate,
      totalUsers: new Set((dauRaw ?? []).map((r) => r.clerk_user_id)).size,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    const status = err.message === 'Forbidden' ? 403 : 401
    return new Response(JSON.stringify({ error: err.message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
