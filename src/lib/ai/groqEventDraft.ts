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
  return `You are OnChainIn's senior event-copy and ops AI for college/community events in India (workshops, hackathons, fests, esports, talks).

Turn a short organizer prompt into a complete structured JSON event draft. Respond with ONLY valid JSON (no markdown fences).

## CRITICAL: description field (most important)
Write a **long, polished public event description** that organizers can publish almost as-is:
- **Minimum 180 words, target 220–320 words** (never a 1–2 sentence blurb).
- Use 3–5 short paragraphs separated by \\n\\n inside the JSON string.
- Cover ALL of these in natural prose (not bullet lists unless one short "What you'll get" paragraph):
  1) Hook + what the event is and who it is for
  2) Agenda / flow of the day (morning → sessions → networking / closing)
  3) Who should attend and what they will learn or experience
  4) How OnChainIn runs it: apply → organizer approval → ticket/QR → event-day check-in → certificate / proof after verified attendance
  5) Practical notes: city/venue vibe if known, what to bring, free vs paid if implied, prizes/hackathon rules if relevant
- Tone: clear, energetic, professional, campus-friendly. No spammy hype. No inventing fake celebrity speakers unless the user named them.
- If the user prompt is short, **expand creatively but realistically** — do not leave description thin.

## Other field rules
- title: catchy, specific (not just "Event")
- category: e.g. Technology / AI, Hackathon, Gaming / Esports, Cultural, Entrepreneurship
- event_date: ISO YYYY-MM-DD if mentioned; if missing, omit and add a warning
- start_time / end_time: HH:MM 24h; defaults 10:00–17:00 if not said
- max_participants: integer when seats mentioned; else sensible default 50–200 by type
- venue / city: use if given; else plausible "To be announced" / empty city
- registration_fields: **exactly 4–6 UNIQUE questions**. NEVER repeat Name/Full Name/Email/Phone. Prefer: one Full Name, one Email, one Phone, College, Why attend, plus at most 1–2 custom questions.
- volunteer_roles: 3–5 roles with **2–3 sentence** descriptions each
- sponsor_packages: 2–3 packages with rich description + 3–5 benefits each
- budget_categories: mix of income and expense line titles
- certificate_enabled: true unless user says no
- warnings: short notes for missing date/city/seats etc.
- currentDate is ${currentDate} (${timezone}). Prefer dates on/after today for "next week" / relative phrases.

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
      temperature: 0.65,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(currentDate, timezone) },
        {
          role: 'user',
          content: `Create a full OnChainIn event draft from this organizer idea.

Write a LONG, multi-paragraph "description" (220–320 words) covering who it's for, agenda, outcomes, and how registration/check-in/certificates work. Do not write a short blurb.

Organizer prompt:
${prompt.trim()}`,
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

  // If model still returned a thin description, expand once more (description-only).
  const desc = (parsed.description || '').trim()
  const wordCount = desc ? desc.split(/\s+/).filter(Boolean).length : 0
  if (wordCount > 0 && wordCount < 120) {
    try {
      const richer = await expandDescriptionWithGroq(apiKey, model, prompt, parsed)
      if (richer) parsed.description = richer
    } catch {
      /* keep original */
    }
  }

  return parsed
}

/** Second pass: force a long marketing description when the first draft is too short. */
async function expandDescriptionWithGroq(
  apiKey: string,
  model: string,
  organizerPrompt: string,
  draft: GroqEventDraft,
): Promise<string | null> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You write long, publish-ready event descriptions for campus events. Return ONLY JSON: { "description": string }. Description must be 220–320 words, 3–5 paragraphs separated by \\n\\n. Cover hook, agenda, audience, outcomes, registration/approval/check-in/certificate flow.',
        },
        {
          role: 'user',
          content: `Expand this into a full event description.

Title: ${draft.title || 'Event'}
Category: ${draft.category || 'General'}
City: ${draft.city || 'TBD'}
Venue: ${draft.venue || 'TBD'}
Date: ${draft.event_date || 'TBD'}
Organizer idea: ${organizerPrompt}
Short draft to expand: ${draft.description || ''}`,
        },
      ],
    }),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = json.choices?.[0]?.message?.content
  if (!content) return null
  try {
    const parsed = JSON.parse(content) as { description?: string }
    const d = (parsed.description || '').trim()
    return d.length > 80 ? d : null
  } catch {
    return null
  }
}
