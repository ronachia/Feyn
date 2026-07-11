import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { isPremiumUser } from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    // Voice Mode (Whisper transcription) is a Premium-only feature.
    if (!(await isPremiumUser(userId))) {
      return new Response(
        JSON.stringify({ error: 'Voice Mode is a Premium feature. Upgrade to use voice transcription.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    if (!audioFile) throw new Error('No audio file provided')

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    const result = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    })

    return new Response(
      JSON.stringify({
        text: result.text,
        duration: (result as { duration?: number }).duration ?? 0,
        language: (result as { language?: string }).language ?? 'en',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
