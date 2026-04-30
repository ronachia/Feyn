import OpenAI from 'openai'

export async function transcribeAudio(audioBlob, apiKey) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const ext  = audioBlob.type.includes('ogg')  ? 'ogg'
             : audioBlob.type.includes('mp4')  ? 'mp4'
             : 'webm'
  const file = new File([audioBlob], `recording.${ext}`, { type: audioBlob.type })

  const result = await client.audio.transcriptions.create({
    file,
    model:           'whisper-1',
    language:        'en',
    response_format: 'verbose_json',
  })

  return {
    text:     result.text,
    duration: result.duration || 0,
    language: result.language,
  }
}

export async function analyzeFluency({ text, duration, apiKey }) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const wordCount     = text.trim().split(/\s+/).length
  const wpm           = duration > 0 ? Math.round((wordCount / duration) * 60) : null
  const fillerPattern = /\b(um|uh|like|you know|kind of|sort of|basically|literally|right|okay|so)\b/gi
  const fillers       = [...text.matchAll(fillerPattern)].map((m) => m[0].toLowerCase())

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
    model:           'gpt-4o-mini',
    messages:        [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature:     0.3,
  })

  return { wpm, ...JSON.parse(response.choices[0].message.content) }
}
