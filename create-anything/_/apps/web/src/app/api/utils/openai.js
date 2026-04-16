/**
 * Direct OpenAI API client — no CA proxy, no fallbacks.
 * All AI calls in this app go through here.
 *
 * Model: gpt-4o-mini (text + vision)
 * Key:   OPENAI_API_KEY environment variable
 */

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

function getKey() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not configured')
  return key
}

/**
 * Core chat completion — text only.
 * Returns the raw string content from the model.
 */
export async function chat({ model = DEFAULT_MODEL, messages, temperature = 0.3, response_format, max_tokens } = {}) {
  const resp = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(response_format && { response_format }),
      ...(max_tokens && { max_tokens }),
    }),
  })

  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`OpenAI ${resp.status}: ${body.slice(0, 300)}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Vision completion — accepts a mix of text and image_url content parts.
 * Pass imageUrl as a public https:// URL or a data: base64 string.
 * Returns the raw string content from the model.
 */
export async function vision({ model = DEFAULT_MODEL, systemPrompt, userText, imageUrl, temperature = 0.3, max_tokens = 800 } = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        ...(userText ? [{ type: 'text', text: userText }] : []),
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
      ],
    },
  ]

  const resp = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  })

  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`OpenAI vision ${resp.status}: ${body.slice(0, 300)}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Parse JSON from a model response, stripping markdown code fences if present.
 */
export function parseJSON(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned)
}
