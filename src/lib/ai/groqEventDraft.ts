/**
 * Direct Groq chat completion for AI event drafts.
 * Set VITE_GROQ_API_KEY in .env (and Vercel) then restart/redeploy.
 *
 * Note: VITE_ keys are bundled into the browser. For production, prefer
 * a server/edge proxy. Fine for hackathon demos with a restricted key.
 */

export type GroqEventDraft = {
  title?: string
  category?: string
  description?: string
  event_date?: string
  start_time?: string
  end_time?: string
  venue?: string
  city?: string
  max_participants?: number
  registration_fields?: Array<{
    label?: string
    field_type?: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'checkbox'
    required?: boolean
    options?: string[]
  }>
  volunteer_roles?: Array<{ role?: string; description?: string }>
  sponsor_packages?: Array<{ title?: string; description?: string; benefits?: string[] }>
  budget_categories?: Array<{ type?: 'income' | 'expense'; title?: string }>
  certificate_enabled?: boolean
  warnings?: string[]
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
/** Fast + good JSON; override with VITE_GROQ_MODEL if needed */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

export function isGroqConfigured(): boolean {
  const key = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim()
  return Boolean(key && key.length > 10 && !key.includes('YOUR_') && !key.includes('your_'))
}

export function getGroqApiKey(): string | null {
  if (!isGroqConfigured()) return null
  return (import.meta.env.VITE_GROQ_API_KEY as string).trim()
}

function buildSystemPrompt(currentDate: string, timezone: string) {
  return `You are OnChainIn event ops AI. Turn a natural-language event idea into a structured JSON draft for a campus/community event platform with registration approval, volunteers, sponsors, budget, and certificates.

Rules:
- Respond with ONLY valid JSON (no markdown).
- Use ISO date YYYY-MM-DD for event_date when a date is mentioned; if missing, omit event_date and add a warning.
- Times as HH:MM 24h if mentioned, else sensible defaults (10:00–16:00).
- max_participants as integer when seats are mentioned.
- registration_fields: 4–7 practical questions.
- volunteer_roles: 2–4 roles with short descriptions.
- sponsor_packages: 1–3 packages with benefits arrays.
- budget_categories: mix of income and expense titles.
- certificate_enabled: true unless user says no certificates.
- warnings: array of short strings for missing info.
- currentDate is ${currentDate} (${timezone}). Prefer dates on or after today when user says "next week" etc.

JSON shape:
{
  "title": string,
  "category": string,
  "description": string,
  "event_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "venue": string,
  "city": string,
  "max_participants": number,
  "registration_fields": [{ "label": string, "field_type": "text|textarea|email|phone|select|number|checkbox", "required": boolean, "options": string[] }],
  "volunteer_roles": [{ "role": string, "description": string }],
  "sponsor_packages": [{ "title": string, "description": string, "benefits": string[] }],
  "budget_categories": [{ "type": "income"|"expense", "title": string }],
  "certificate_enabled": boolean,
  "warnings": string[]
}`
}

export async function generateEventDraftWithGroq(
  prompt: string,
  opts?: { currentDate?: string; timezone?: string },
): Promise<GroqEventDraft> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new Error(
      'Groq API key missing. Add VITE_GROQ_API_KEY to .env (from https://console.groq.com/keys) and restart the app.',
    )
  }

  const currentDate =
    opts?.currentDate ||
    new Date().toISOString().slice(0, 10)
  const timezone = opts?.timezone || 'Asia/Kolkata'
  const model =
    (import.meta.env.VITE_GROQ_MODEL as string | undefined)?.trim() || DEFAULT_MODEL

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(currentDate, timezone) },
        {
          role: 'user',
          content: `Create an event draft for this organizer prompt:\n\n${prompt.trim()}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401) {
      throw new Error('Groq rejected the API key (401). Check VITE_GROQ_API_KEY.')
    }
    if (res.status === 429) {
      throw new Error('Groq rate limit hit. Wait a moment and try again.')
    }
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 200) || res.statusText}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned an empty response.')

  let parsed: GroqEventDraft
  try {
    parsed = JSON.parse(content) as GroqEventDraft
  } catch {
    // Try extract JSON object if model wrapped it
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Groq response was not valid JSON.')
    parsed = JSON.parse(match[0]) as GroqEventDraft
  }

  if (!parsed.title && !parsed.description) {
    throw new Error('Groq draft was incomplete. Try a more detailed prompt.')
  }

  return parsed
}
