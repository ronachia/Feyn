import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { isPremiumUser } from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    // Custom lesson creation is a Premium-only feature.
    if (!(await isPremiumUser(userId))) {
      return new Response(
        JSON.stringify({ error: 'Creating custom lessons is a Premium feature.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, source, title, level, subLevel, category, estimatedMinutes } = await req.json()

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    if (action === 'generate-key-points') {
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract exactly 5 key points and 5 vocabulary words from this content that a ${level} English language learner (${subLevel}) should learn.
Return as a JSON object: { 
  "title": "...", 
  "keyPoints": ["...", "...", "...", "...", "..."],
  "vocabulary": ["...", "...", "...", "...", "..."]
}

Content: ${String(source).slice(0, 2000)}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })
      const data = JSON.parse(res.choices[0].message.content!)
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'generate-content') {
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Write a ${level} level (${subLevel}) English lesson about "${title}" for the "${category}" category.
The lesson should be approximately ${estimatedMinutes * 20} words, suitable for a ${estimatedMinutes}-minute study session.
Return as JSON: { "content": "...", "estimatedMinutes": ${estimatedMinutes} }`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
      const data = JSON.parse(res.choices[0].message.content!)
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
