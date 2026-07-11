import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { checkAndIncrementDailyQuota } from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await verifyClerkJWT(req.headers.get('Authorization'))

    const { originalContent, userExplanation, keyPoints } = await req.json()

    if (!originalContent || !userExplanation) {
      throw new Error('originalContent and userExplanation are required')
    }
    if (originalContent.length > 6000) {
      throw new Error('originalContent exceeds maximum length of 6000 characters')
    }
    if (userExplanation.length > 3000) {
      throw new Error('userExplanation exceeds maximum length of 3000 characters')
    }

    const allowed = await checkAndIncrementDailyQuota(userId)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Daily AI analysis limit reached. Upgrade to Premium for unlimited analyses.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    const prompt = `You are an English learning coach using the Feynman technique.

ORIGINAL CONTENT the student read:
"${originalContent}"

KEY POINTS the student should have covered:
${keyPoints.map((kp: string, i: number) => `${i + 1}. ${kp}`).join('\n')}

STUDENT'S EXPLANATION (in English, with their own words):
"${userExplanation}"

Analyze their explanation and return a JSON object with exactly this structure:
{
  "clarityScore": <number 1-10, how clear and simple the explanation is>,
  "coverageScore": <number 1-10, how many key points were covered>,
  "overallScore": <number 1-10, weighted average>,
  "grammarErrors": [
    { "error": "<what they wrote>", "correction": "<correct version>", "tip": "<brief explanation>" }
  ],
  "coveredPoints": ["<key point that was covered>"],
  "missedPoints": ["<key point that was missing>"],
  "gaps": ["<grammar concept or vocabulary gap detected, e.g. 'articles', 'past tense', 'prepositions'>"],
  "simplificationTip": "<one actionable suggestion to make the explanation simpler>",
  "positiveNote": "<specific thing the student did well>",
  "encouragement": "<short motivating message (1 sentence)>",
  "suggestedExplanation": "<a model Feynman-style explanation of the content in simple English>"
}

Rules:
- Be encouraging but honest
- Grammar errors: list maximum 3, prioritize the most impactful ones
- If the explanation is empty or very short (less than 10 words), set all scores to 1 and note this
- Keep all text in English
- The suggestedExplanation should be simple enough for a child to understand`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content!)

    return new Response(JSON.stringify(result), {
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
