import { createClient } from 'npm:@supabase/supabase-js'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function requireAdmin(authHeader: string | null): Promise<string> {
  const userId = await verifyClerkJWT(authHeader)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_user_id', userId)
    .single()
  if (!profile?.is_admin) throw new Error('Forbidden: admin only')
  return userId
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await requireAdmin(req.headers.get('Authorization'))

    const { action, id, lesson } = await req.json()

    // ── LIST ────────────────────────────────────────────────────
    if (action === 'list') {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return new Response(JSON.stringify({ lessons: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── CREATE ──────────────────────────────────────────────────
    if (action === 'create') {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          slug:              lesson.slug,
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
          is_active:         lesson.isActive ?? false,
          sort_order:        lesson.sortOrder ?? 9999,
        })
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ lesson: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── UPDATE ──────────────────────────────────────────────────
    if (action === 'update') {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          slug:              lesson.slug,
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
          sort_order:        lesson.sortOrder,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ lesson: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── TOGGLE PUBLISH ──────────────────────────────────────────
    if (action === 'toggle') {
      const { data, error } = await supabase
        .from('lessons')
        .update({ is_active: lesson.isActive })
        .eq('id', id)
        .select('id, is_active')
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ lesson: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (action === 'delete') {
      const { error } = await supabase.from('lessons').delete().eq('id', id)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    const status = err.message?.includes('Forbidden') ? 403
                 : err.message?.includes('Missing')   ? 401 : 500
    return new Response(JSON.stringify({ error: err.message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
