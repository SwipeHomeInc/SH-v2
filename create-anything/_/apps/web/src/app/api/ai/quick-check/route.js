/**
 * POST /api/ai/quick-check
 *
 * The main "user sees an issue, snaps a photo and describes it" flow.
 *
 * Steps:
 *  1. Run photo vision analysis  ─┐
 *                                  ├─ in PARALLEL
 *  2. Run description analysis   ─┘
 *  3. Feed both into LYRA synthesis prompt → one clean answer
 *
 * Either imageUrl or description can be omitted — both together gives the
 * best result, but the route degrades gracefully with only one.
 */

import { getAuthUser } from '@/app/api/utils/auth'
import { vision, chat, parseJSON } from '@/app/api/utils/openai'

// ─── PROMPT 1: VISION ────────────────────────────────────────────────────────
const VISION_SYSTEM_PROMPT = `You are a home condition assistant that helps homeowners understand what they're looking at in photos of their home.

Your job is to look at the photo and:
1. Identify what object or area of the home is shown
2. Describe what you see in plain, everyday language
3. Note any visible issues, damage, or items that may need monitoring
4. Assess the overall condition based only on what is visible

IMPORTANT RULES:
- Do not diagnose beyond visible evidence
- Do not speculate about hidden damage
- Do not recommend specific repairs or contractors
- Tone must be calm, neutral, and helpful
- Only describe what you can actually see in the photo

Return ONLY a JSON object:
{
  "identified_object": "",
  "description": "",
  "issues_detected": [{ "issue": "", "confidence": "low | medium | high", "severity": "minor | moderate | notable" }],
  "overall_condition": "normal | monitor | needs_attention",
  "summary": "",
  "reassurance_note": ""
}`

// ─── PROMPT 2: DESCRIPTION ANALYZER ─────────────────────────────────────────
const DESCRIPTION_SYSTEM_PROMPT = `You are an AI home issue triage assistant that analyzes homeowner-written descriptions and translates them into structured, practical insights.

Interpret the homeowner description and determine likely system, possible causes, urgency, and next steps — without overreaching.

CONSTRAINTS: No fear-based language. No definitive diagnosis. No jargon. Default to "uncertain" rather than guessing. Do not invent details.

Return ONLY a JSON object:
{
  "system": "",
  "interpreted_issue": "",
  "possible_causes": [{ "cause": "", "confidence": "low | medium | high" }],
  "urgency": "low | medium | high",
  "recommended_trade": "",
  "notes": ""
}`

// ─── LYRA CLARIFIER (runs before description analysis when input is vague) ───
const CLARIFIER_PROMPT = `You are a patient home maintenance interpreter. Homeowners often describe problems in vague, informal, or confusing ways. Translate their description into clear, plain English that another AI can analyze. Preserve all their information. Translate informal terms to standard home terminology. Return only the clarified description as a plain string — no JSON, no explanation.`

// ─── PROMPT 3: LYRA-OPTIMIZED SYNTHESIS ──────────────────────────────────────
const SYNTHESIS_SYSTEM_PROMPT = `You are an AI home guidance assistant that combines photo analysis and written description analysis into one clear, homeowner-friendly answer.

Objective:
Synthesize two inputs into a single, practical recommendation with clear next steps.

Inputs you will receive: photo_analysis (JSON) and description_analysis (JSON).

Instructions:
1. Prioritize photo evidence — if conflict exists, trust visual data first
2. Determine likely issue — combine both inputs into one clear explanation
3. Assess severity — Minor | Moderate | Significant
4. Determine action path — choose one: DIY possible | Monitor | Needs professional
5. Recommend trade — based on best combined insight
6. Set urgency — Low | Medium | High
7. Provide one immediate action — something simple and safe the homeowner can do right now
8. Tone — calm, reassuring, practical. No jargon. No fear.

CONSTRAINTS:
- Do not contradict photo evidence
- Do not escalate unnecessarily
- Keep it actionable and simple

Return ONLY a JSON object with this exact structure:
{
  "likely_issue": "",
  "severity": "minor | moderate | significant",
  "recommended_action": "monitor | DIY | professional",
  "recommended_trade": "",
  "urgency": "low | medium | high",
  "immediate_step": "",
  "summary": "",
  "reassurance_note": ""
}`

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function looksConfusing(text) {
  if (!text || text.length < 10) return false
  return [
    /\bthing(y|ie)?\b/i, /\bstuff\b/i, /\bidk\b/i, /\bno idea\b/i,
    /\bit('s| is) (doing|making|happening)\b/i,
    /\bsomething\b.*\bwrong\b/i, /\bthe (noise|sound|smell) again\b/i,
  ].some((p) => p.test(text))
}

function fallbackResult(reason) {
  return {
    likely_issue: 'Unable to determine',
    severity: 'minor',
    recommended_action: 'monitor',
    recommended_trade: 'General handyman',
    urgency: 'low',
    immediate_step: 'Take additional photos and note when the issue occurs.',
    summary: reason || 'We could not fully analyze this issue. Please try again.',
    reassurance_note: 'Most home issues are manageable when caught early.',
  }
}

async function runVision(imageUrl, userText) {
  const contextLine = userText?.trim()
    ? `Homeowner note: "${userText.trim()}"\n\nFactor this note into your analysis.`
    : 'Analyze this photo and describe what you see.'

  const raw = await vision({
    systemPrompt: VISION_SYSTEM_PROMPT,
    userText: contextLine,
    imageUrl,
    temperature: 0.2,
    max_tokens: 600,
  })
  return parseJSON(raw)
}

async function runDescriptionAnalysis(description) {
  // Clarify vague input before sending to analyzer
  let clarified = description
  if (looksConfusing(description)) {
    try {
      const c = await chat({
        messages: [
          { role: 'system', content: CLARIFIER_PROMPT },
          { role: 'user', content: description },
        ],
        temperature: 0.2,
        max_tokens: 300,
      })
      clarified = c.trim() || description
    } catch {
      clarified = description
    }
  }

  const raw = await chat({
    messages: [
      { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
      { role: 'user', content: clarified },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })
  return parseJSON(raw)
}

async function runSynthesis(photoAnalysis, descriptionAnalysis) {
  const raw = await chat({
    messages: [
      { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          photo_analysis: photoAnalysis || null,
          description_analysis: descriptionAnalysis || null,
        }),
      },
    ],
    temperature: 0.25,
    max_tokens: 600,
  })
  return parseJSON(raw)
}

// ─── ROUTE ───────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getAuthUser(request)
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { imageUrl, description } = body

    if (!imageUrl && !description?.trim()) {
      return Response.json(
        { error: 'Provide at least a photo (imageUrl) or a description.' },
        { status: 400 }
      )
    }

    // ── Step 1 & 2: Run vision + text analysis IN PARALLEL ──────────────────
    const [visionResult, textResult] = await Promise.allSettled([
      imageUrl ? runVision(imageUrl, description) : Promise.resolve(null),
      description?.trim() ? runDescriptionAnalysis(description.trim()) : Promise.resolve(null),
    ])

    const photoAnalysis  = visionResult.status  === 'fulfilled' ? visionResult.value  : null
    const textAnalysis   = textResult.status    === 'fulfilled' ? textResult.value    : null

    if (!photoAnalysis && !textAnalysis) {
      return Response.json({ ok: false, result: fallbackResult('Both analysis steps failed.') })
    }

    // ── Step 3: Synthesize both results into one final answer ────────────────
    let result
    try {
      result = await runSynthesis(photoAnalysis, textAnalysis)
    } catch (e) {
      console.error('Synthesis failed:', e)
      // If synthesis fails, stitch together a basic result from what we have
      result = fallbackResult('Synthesis step unavailable.')
      if (photoAnalysis) {
        result.likely_issue = photoAnalysis.summary || result.likely_issue
        result.severity = photoAnalysis.overall_condition === 'needs_attention' ? 'moderate' : 'minor'
      }
      if (textAnalysis) {
        result.recommended_trade = textAnalysis.recommended_trade || result.recommended_trade
        result.urgency = textAnalysis.urgency || result.urgency
      }
    }

    // Normalise output shape
    const final = {
      likely_issue:       result.likely_issue       || 'See details below',
      severity:           result.severity            || 'minor',
      recommended_action: result.recommended_action  || 'monitor',
      recommended_trade:  result.recommended_trade   || '',
      urgency:            result.urgency             || 'low',
      immediate_step:     result.immediate_step      || '',
      summary:            result.summary             || '',
      reassurance_note:   result.reassurance_note    || '',
    }

    return Response.json({
      ok: true,
      result: final,
      // Debug breakdown — useful during development, ignored by the UI
      _photoAnalysis: photoAnalysis,
      _textAnalysis: textAnalysis,
    })
  } catch (error) {
    console.error('quick-check error:', error)
    return Response.json(
      { ok: false, result: fallbackResult(error?.message), error: error?.message },
      { status: 500 }
    )
  }
}
