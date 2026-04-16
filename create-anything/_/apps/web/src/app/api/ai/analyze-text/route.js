import { getAuthUser } from '@/app/api/utils/auth'
import { chat, parseJSON } from '@/app/api/utils/openai'

// ─── LYRA-OPTIMIZED SYSTEM PROMPT ────────────────────────────────────────────
// Description Analyzer — translates homeowner-written issue descriptions into
// structured, practical insights. No fear-based language, no definitive diagnosis.
// ─────────────────────────────────────────────────────────────────────────────
const DESCRIPTION_SYSTEM_PROMPT = `You are an AI home issue triage assistant that analyzes homeowner-written descriptions and translates them into structured, practical insights.

Objective:
Interpret a short homeowner description and determine likely system, possible causes, urgency, and next steps—without overreaching.

Instructions:
1. Identify system or area — choose the most likely category: Plumbing, Electrical, HVAC, Roofing, Foundation, Interior, Exterior, Appliance, Other
2. Interpret the issue — restate the problem clearly in plain English
3. List possible causes — provide 2–4 realistic possibilities, label each with confidence level, avoid speculation beyond the description
4. Assess urgency — classify as: Low (can wait), Medium (should address soon), High (needs prompt attention)
5. Recommend contractor type — be specific but simple (e.g., "plumber," "electrician")

CONSTRAINTS:
- No fear-based language
- No definitive diagnosis
- No unnecessary technical jargon
- Default to "uncertain" rather than guessing
- Stay conservative — if unclear, say so
- Do not invent details

Return ONLY a JSON object with this exact structure:
{
  "system": "",
  "interpreted_issue": "",
  "possible_causes": [
    {
      "cause": "",
      "confidence": "low | medium | high"
    }
  ],
  "urgency": "low | medium | high",
  "recommended_trade": "",
  "notes": ""
}`

// ─── LYRA CLARIFIER ──────────────────────────────────────────────────────────
// When a homeowner's description is vague, confusing, or only-they-can-understand,
// this step translates it into something the main analyzer can actually work with.
// Runs before the main analysis when input looks unclear.
// ─────────────────────────────────────────────────────────────────────────────
const CLARIFIER_PROMPT = `You are a patient home maintenance interpreter. Homeowners often describe problems in vague, informal, or confusing ways. Your job is to translate their description into clear, plain English that another AI can analyze.

Rules:
- Preserve all information the homeowner gave you — don't drop any details
- Clean up grammar and clarity, but keep their meaning intact
- If they use informal terms ("the thingy under the sink," "that clicking noise again"), translate to standard home terminology
- If the description is already clear, return it as-is
- Do not add assumptions or invented details
- Return only the clarified description as a plain string — no JSON, no explanation`

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function looksConfusing(text) {
  if (!text || text.length < 10) return false
  const vaguePatterns = [
    /\bthing(y|ie)?\b/i,
    /\bstuff\b/i,
    /\bit('s| is) (doing|making|happening)\b/i,
    /\bthe (noise|sound|smell) again\b/i,
    /\bidk\b/i,
    /\bno idea\b/i,
    /\bsomething\b.*\bwrong\b/i,
    /\bbroken\b.*\bsomehow\b/i,
  ]
  return vaguePatterns.some((p) => p.test(text))
}

function buildFallback(raw) {
  return {
    system: 'Other',
    interpreted_issue: raw || 'Unable to interpret description.',
    possible_causes: [],
    urgency: 'low',
    recommended_trade: 'General handyman',
    notes: 'Description was unclear. A professional inspection may help.',
  }
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getAuthUser(request)
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    let { description } = body

    if (!description?.trim()) {
      return Response.json({ error: 'description is required' }, { status: 400 })
    }

    description = description.trim()

    // ── Step 1: Clarify if the input looks vague/confusing ──────────────────
    let clarified = description
    let wasClarified = false

    if (looksConfusing(description)) {
      try {
        clarified = await chat({
          messages: [
            { role: 'system', content: CLARIFIER_PROMPT },
            { role: 'user', content: description },
          ],
          temperature: 0.2,
          max_tokens: 300,
        })
        clarified = clarified.trim() || description
        wasClarified = clarified !== description
      } catch (e) {
        console.warn('Clarifier step failed, using original description:', e.message)
        clarified = description
      }
    }

    // ── Step 2: Run description through the main analyzer ──────────────────
    let raw
    try {
      raw = await chat({
        messages: [
          { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
          { role: 'user', content: clarified },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    } catch (e) {
      console.error('Description analysis failed:', e)
      return Response.json({ ok: false, analysis: buildFallback(description) }, { status: 200 })
    }

    let analysis
    try {
      analysis = parseJSON(raw)
    } catch {
      analysis = buildFallback(clarified)
    }

    const result = {
      system: analysis.system || 'Other',
      interpreted_issue: analysis.interpreted_issue || clarified,
      possible_causes: Array.isArray(analysis.possible_causes) ? analysis.possible_causes : [],
      urgency: analysis.urgency || 'low',
      recommended_trade: analysis.recommended_trade || '',
      notes: analysis.notes || '',
      // Pass-through metadata — useful for the synthesis step
      _original: description,
      _clarified: wasClarified ? clarified : null,
    }

    return Response.json({ ok: true, analysis: result })
  } catch (error) {
    console.error('analyze-text error:', error)
    return Response.json(
      { error: error?.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}
