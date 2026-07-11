import OpenAI from 'npm:openai'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    await verifyClerkJWT(req.headers.get('Authorization'))

    const { gaps } = await req.json()
    const gapList = (gaps as string[]).slice(0, 4).join(', ')

    const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

    const prompt = `You are an English language exercise generator using the Feynman method.

The student has the following recurring grammar/vocabulary gaps: ${gapList}

Generate exactly 4 exercises targeting these gaps. Mix the types for variety.

Return a JSON object with this exact structure:
{
  "exercises": [
    {
      "id": 1,
      "type": "fill_blank",
      "targetGap": "<which gap this targets>",
      "question": "Complete the sentence: 'I went to ___ store to buy milk.'",
      "blank": "___",
      "answer": "the",
      "explanation": "Use 'the' before specific nouns that both speaker and listener know about.",
      "xpReward": 20
    },
    {
      "id": 2,
      "type": "error_correction",
      "targetGap": "<which gap this targets>",
      "question": "Find and fix the mistake: 'She don't like coffee in the morning.'",
      "answer": "She doesn't like coffee in the morning.",
      "explanation": "With he/she/it in the present tense, use 'doesn't' (does + not), not 'don't'.",
      "xpReward": 25
    },
    {
      "id": 3,
      "type": "multiple_choice",
      "targetGap": "<which gap this targets>",
      "question": "Choose the correct option: 'They ___ to Paris last summer.'",
      "options": ["go", "goes", "went", "going"],
      "answer": "went",
      "explanation": "'Last summer' signals past tense. 'Went' is the past form of 'go'.",
      "xpReward": 20
    },
    {
      "id": 4,
      "type": "word_order",
      "targetGap": "<which gap this targets>",
      "question": "Put the words in the correct order:",
      "words": ["yesterday", "I", "coffee", "a", "drank", "cup", "of"],
      "answer": "I drank a cup of coffee yesterday.",
      "explanation": "In English: Subject + Verb + Object + Time expression.",
      "xpReward": 25
    }
  ]
}

Rules:
- Make exercises practical and relevant to daily English use
- Difficulty should be beginner to intermediate
- Explanations must be simple (Feynman style — explain like to a 10-year-old)
- Each exercise must clearly target one of the provided gaps
- xpReward should be between 15 and 30`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const result = JSON.parse(response.choices[0].message.content!)
    return new Response(JSON.stringify(result.exercises), {
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
