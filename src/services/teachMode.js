import OpenAI from 'openai'

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

export async function getStudentQuestion({ topic, explanation, history, round, apiKey }) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const isFinal = round >= 3

  const userPrompt = round === 0
    ? `Topic: "${topic}"\n\nMy teacher just explained:\n"${explanation}"\n\nAsk your first question about something that confused you in the explanation.`
    : isFinal
    ? `Topic: "${topic}"\n\nOriginal explanation:\n"${explanation}"\n\nYou've had ${round} rounds of Q&A. Now give your final verdict as Alex. Return the JSON format described in the system prompt.`
    : `Continue the conversation naturally. Ask your next question about something still unclear.`

  const messages = [
    { role: 'system', content: STUDENT_SYSTEM },
    { role: 'user',   content: userPrompt },
    ...history.map((m) => ({
      role:    m.role === 'student' ? 'assistant' : 'user',
      content: m.content,
    })),
  ]

  if (isFinal) {
    const response = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature:     0.7,
    })
    const data = JSON.parse(response.choices[0].message.content)
    return {
      question:     data.question || data.summary || 'I think I get it now!',
      concluded:    true,
      masteryScore: data.masteryScore || 7,
      summary:      data.summary || '',
    }
  }

  const response = await client.chat.completions.create({
    model:       'gpt-4o-mini',
    messages,
    temperature: 0.8,
  })

  return {
    question:  response.choices[0].message.content.trim(),
    concluded: false,
  }
}
