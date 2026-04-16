import { getAuthUser } from '@/app/api/utils/auth'
import { vision, parseJSON } from '@/app/api/utils/openai'

// ─── LYRA-OPTIMIZED SYSTEM PROMPT ────────────────────────────────────────────
// Photo Vision AI — identifies what is in a home photo and surfaces visible issues.
// Output schema defined by LYRA. Constraints: no hidden-damage speculation,
// no contractor recommendations, calm and neutral tone.
// ─────────────────────────────────────────────────────────────────────────────
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

Return your response as a JSON object with this EXACT structure:
{
  "identified_object": "What object or area of the home is shown",
  "description": "Plain English description of what you see (2-3 sentences)",
  "issues_detected": [
    {
      "issue": "Description of the visible issue",
      "confidence": "low | medium | high",
      "severity": "minor | moderate | notable"
    }
  ],
  "overall_condition": "normal | monitor | needs_attention",
  "summary": "A brief one-sentence summary of the overall state",
  "reassurance_note": "A calm, reassuring note for the homeowner"
}

If no issues are detected, return an empty array for issues_detected.`

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
function buildFallback(reason = '') {
  return {
    identified_object: 'Home area',
    description: 'We were unable to analyze this photo. Please try again with a clearer image.',
    issues_detected: [],
    overall_condition: 'normal',
    summary: reason || 'Photo analysis unavailable.',
    reassurance_note: 'Try taking the photo in better lighting or from a closer angle.',
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
    const { imageUrl, userText } = body

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Accept public https:// URLs or data: base64 strings (mobile camera capture)
    const isDataUrl = String(imageUrl).startsWith('data:')
    if (!isDataUrl && !/^https?:\/\//i.test(imageUrl)) {
      return Response.json(
        { error: 'imageUrl must be a public https URL or a data: string' },
        { status: 400 }
      )
    }

    // Compose user-facing context line if the homeowner added a description
    const contextLine = userText?.trim()
      ? `Homeowner note: "${userText.trim()}"\n\nPlease factor this note into your analysis.`
      : 'Please analyze this photo and describe what you see.'

    let raw
    try {
      raw = await vision({
        systemPrompt: VISION_SYSTEM_PROMPT,
        userText: contextLine,
        imageUrl,
        temperature: 0.2,
        max_tokens: 600,
      })
    } catch (e) {
      console.error('Vision call failed:', e)

      // Surface useful error messages to the client
      if (e.message?.includes('400')) {
        return Response.json(
          { error: 'Could not read that image. Try a JPG or PNG photo.', analysis: buildFallback() },
          { status: 400 }
        )
      }
      if (e.message?.includes('429')) {
        return Response.json(
          { error: 'Photo analysis is busy — please try again in a moment.', analysis: buildFallback() },
          { status: 429 }
        )
      }

      return Response.json({ ok: false, analysis: buildFallback(e.message) }, { status: 200 })
    }

    let analysis
    try {
      analysis = parseJSON(raw)
    } catch {
      // Model returned non-JSON — wrap the text into our schema shape
      analysis = {
        identified_object: 'Home area',
        description: String(raw).slice(0, 400),
        issues_detected: [],
        overall_condition: 'normal',
        summary: String(raw).slice(0, 120),
        reassurance_note: '',
      }
    }

    // Normalise — ensure every expected field is present
    const result = {
      identified_object: analysis.identified_object || 'Home area',
      description: analysis.description || '',
      issues_detected: Array.isArray(analysis.issues_detected) ? analysis.issues_detected : [],
      overall_condition: analysis.overall_condition || 'normal',
      summary: analysis.summary || '',
      reassurance_note: analysis.reassurance_note || '',
    }

    return Response.json({ ok: true, analysis: result })
  } catch (error) {
    console.error('analyze-photo error:', error)
    return Response.json(
      { error: error?.message || 'Something went wrong', analysis: buildFallback() },
      { status: 500 }
    )
  }
}
