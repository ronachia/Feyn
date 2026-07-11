import { createClient } from 'npm:@supabase/supabase-js'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ALLOWED_EVENTS = new Set([
  'lesson_started', 'lesson_completed',
  'analysis_requested', 'analysis_passed', 'analysis_failed',
  'gap_detected', 'gap_fixed',
  'teach_mode_started', 'teach_mode_completed',
  'practice_started', 'practice_completed',
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))
    const { event_name, properties = {} } = await req.json()

    if (!ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: 'Unknown event' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('analytics_events').insert({
      clerk_user_id: userId,
      event_name,
      properties,
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
