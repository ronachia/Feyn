import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { isPremiumUser } from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    // Fluency analysis only runs from Voice Mode, a Premium-only feature.
    if (!(await isPremiumUser(userId))) {
      return new Response(
        JSON.stringify({ error: 'Fluency analysis is a Premium feature. Upgrade to use Voice Mode.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, duration } = await req.json()

    const wordCount = text.trim().split(/\s+/).length
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : null
    const fillerPattern = /\b(um|uh|like|you know|kind of|sort of|basically|literally|right|okay|so)\b/gi
    const fillers = [...text.matchAll(fillerPattern)].map((m: RegExpMatchArray) => m[0].toLowerCase())

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    const prompt = `Analyze this English speech transcript for fluency and speaking quality.

Transcript: "${text}"
Duration: ${duration ? Math.round(duration) + 's' : 'unknown'}
Words per minute: ${wpm ?? 'unknown'} (ideal range: 120-160 wpm)
Filler words detected: ${fillers.length > 0 ? fillers.join(', ') : 'none'}

Return JSON:
{
  "fluencyScore": <1-10, natural flow and delivery>,
  "pacingFeedback": "<one sentence: too slow / good / too fast and why>",
  "fillerCount": ${fillers.length},
  "strength": "<one sentence: what they did well>",
  "improvements": ["up to 2 short specific tips"],
  "overallComment": "<one encouraging sentence>"
}`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content!)
    return new Response(JSON.stringify({ wpm, ...result }), {
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
