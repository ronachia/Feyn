import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    const { progress, profile } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (profile) {
      await supabase.from('profiles').upsert({
        clerk_user_id:       userId,
        goal:                profile.goal,
        level:               profile.level,
        language:            profile.language,
        onboarded_at:        profile.onboardedAt,
        placement_sub_level: profile.placementSubLevel,
      })
    }

    if (progress) {
      const sessionHistory = Array.isArray(progress.sessionHistory)
        ? progress.sessionHistory.slice(0, 100)
        : []
      const customLessons = Array.isArray(progress.customLessons)
        ? progress.customLessons.slice(0, 50)
        : []

      // NOTE: daily_stats is intentionally NOT written here. It's the
      // server-side AI usage counter (see _shared/rateLimit.ts) and must
      // only ever be written by the AI edge functions themselves. If this
      // client-controlled sync ever accepts it again, a free user can reset
      // their own quota via localStorage/DevTools before it's even checked.
      await supabase.from('progress').upsert({
        clerk_user_id:      userId,
        xp:                 progress.xp,
        streak:             progress.streak,
        last_session_date:  progress.lastSessionDate,
        completed_lessons:  progress.completedLessons,
        gaps:               progress.gaps,
        session_history:    sessionHistory,
        earned_badges:      progress.earnedBadges,
        no_peek_count:      progress.noPeekCount,
        high_clarity_count: progress.highClarityCount,
        fixed_gaps:         progress.fixedGaps,
        custom_lessons:     customLessons,
        updated_at:         new Date().toISOString(),
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
