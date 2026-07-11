import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { isPremiumUser } from '../_shared/rateLimit.ts'

const STUDENT_SYSTEM = `You are Teo, a curious and friendly 12-year-old student genuinely trying to understand a topic your teacher just explained.

Your role: Ask ONE simple, sincere question per turn about something that genuinely confused you in the explanation.
Your name is Teo. Base questions on real gaps, vague parts, or unexplained terms in the teacher's explanation
- Sound like a real kid: simple vocabulary, genuine curiosity, not formal
- React naturally when things make sense: "Oh!", "Ahh!", "I see..."
- After round 3, give your final verdict

Question style examples:
- "Wait, I didn't get that part — what do you mean by [term]?"
- "But why does [thing] happen? You didn't explain that."
- "So you're saying [X]... but then what about [Y]?"
- "I understand [part], but I'm still confused about [other part]."

For the final verdict (round 3), return this exact JSON:
{
  "question": "<your final reaction as a student — did you understand? summarize what you learned in simple words>",
  "concluded": true,
  "masteryScore": <1-10, how well the teacher explained — 10 means even a child fully understood>,
  "summary": "<one sentence: what you now understand about the topic>"
}`

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    // Teach Mode (Teo) is a Premium-only feature.
    if (!(await isPremiumUser(userId))) {
      return new Response(
        JSON.stringify({ error: 'Teach Mode is a Premium feature. Upgrade to practice teaching Teo.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { topic, explanation, history, round } = await req.json()

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    const isFinal = round >= 3

    const userPrompt = round === 0
      ? `Topic: "${topic}"\n\nMy teacher just explained:\n"${explanation}"\n\nAsk your first question about something that confused you in the explanation.`
      : isFinal
      ? `You've had ${round} rounds of Q&A about "${topic}". Now give your final verdict as Teo. Return the JSON format described in the system prompt.`
      : `Continue the conversation naturally. Ask your next question about something still unclear.`

    const messages = [
      { role: 'system' as const, content: STUDENT_SYSTEM },
      { role: 'user' as const, content: userPrompt },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'student' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
    ]

    if (isFinal) {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
      const data = JSON.parse(response.choices[0].message.content!)
      return new Response(
        JSON.stringify({
          question: data.question || data.summary || 'I think I get it now!',
          concluded: true,
          masteryScore: data.masteryScore || 7,
          summary: data.summary || '',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
    })

    return new Response(
      JSON.stringify({
        question: response.choices[0].message.content!.trim(),
        concluded: false,
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
