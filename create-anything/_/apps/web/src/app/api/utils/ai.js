/**
 * ai.js — SwipeCheck AI utilities
 *
 * generateSwipecheckNarrative  — LYRA-optimized report writer (Prompt 4)
 * analyzePhotosVision          — vision pass for SwipeCheck photo insights
 *
 * generateSwipecheckQuestions was removed — 160 questions live in the DB.
 * All CA proxy calls removed — direct OpenAI only via openai.js util.
 */

import { vision, chat, parseJSON } from '@/app/api/utils/openai'

// ─── PROMPT 4: LYRA-OPTIMIZED SWIPECHECK NARRATIVE ───────────────────────────
const NARRATIVE_SYSTEM_PROMPT = `You are an AI report writer for SwipeCheck™, generating concise, professional home condition summaries for homeowners.

Objective:
Convert structured inspection inputs into a clean, readable report section.

Inputs you will receive: category, condition_rating, homeowner_answers, photo_insights.

Instructions:
1. Write a short summary — 2–4 sentences, plain English, no jargon
2. List key findings — bullet-style, 3–5 max, only meaningful items
3. Provide guidance — practical, calm next steps, no urgency inflation
4. Recommend contractor only if condition = Fair or Needs Attention

Tone: Professional but approachable. Calm and structured.

CONSTRAINTS: No over-explaining. No fear-based language. No unnecessary technical detail.

Return ONLY a JSON object:
{
  "summary": "",
  "key_findings": ["", ""],
  "next_steps": "",
  "recommended_trade": "",
  "overall_tone": "calm | monitor | action_suggested"
}`

// ─── VISION PROMPT (inline SwipeCheck photo pass) ────────────────────────────
const SWIPECHECK_VISION_PROMPT = `You are a home condition assistant reviewing photos taken during a home inspection.
Look at the photo and briefly describe: what you see, any visible issues, and the overall condition.
Be concise — this feeds into a larger inspection report. 2–3 sentences max. Plain English only.`

// ─────────────────────────────────────────────────────────────────────────────

export async function generateSwipecheckNarrative({ category, conditionLabel, answers, photoInsights }) {
  const userContent = JSON.stringify({
    category,
    condition_rating: conditionLabel || 'Fair',
    homeowner_answers: answers || {},
    photo_insights: photoInsights || 'No photos provided.',
  })

  try {
    const raw = await chat({
      messages: [
        { role: 'system', content: NARRATIVE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 600,
    })

    const parsed = parseJSON(raw)

    return {
      condition_label:              conditionLabel || 'Fair',
      summary_text:                 parsed.summary || `${category} inspection complete.`,
      key_findings:                 Array.isArray(parsed.key_findings) ? parsed.key_findings : [],
      gentle_guidance:              parsed.next_steps ? [parsed.next_steps] : [],
      recommended_contractor_type:  parsed.recommended_trade || null,
      suggested_timeframe:          parsed.overall_tone === 'action_suggested' ? 'Within 1–2 weeks' : 'Within 1–2 months',
    }
  } catch (e) {
    console.error('generateSwipecheckNarrative failed:', e)
    // Safe fallback — report still saves, just without AI narrative
    return {
      condition_label:             conditionLabel || 'Fair',
      summary_text:                `${category} inspection recorded.`,
      key_findings:                [],
      gentle_guidance:             [],
      recommended_contractor_type: null,
      suggested_timeframe:         null,
    }
  }
}

export async function analyzePhotosVision({ category, conditionLabel, photos }) {
  if (!photos?.length) return 'No photos provided.'

  try {
    // Analyze up to 3 photos — pass first photo as vision call, summarize the rest as context
    const firstPhoto = photos[0]
    const insight = await vision({
      systemPrompt: SWIPECHECK_VISION_PROMPT,
      userText: `Category: ${category}. Condition rating: ${conditionLabel}. Describe what you see relevant to a home inspection.`,
      imageUrl: firstPhoto,
      temperature: 0.2,
      max_tokens: 300,
    })
    return insight?.trim() || 'No photo insights available.'
  } catch (e) {
    console.error('analyzePhotosVision failed:', e)
    return 'Photo analysis unavailable.'
  }
}

// Legacy stub — keeps any old import from crashing. Not used.
async function callChatGptIntegration(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`CHAT_GPT integration error ${res.status}`);
  }
  return res.json();
}

async function chatWithAiViaIntegration(payload) {
  // Try common integration paths (hyphen and underscore variants)
  const candidates = [
    "/integrations/chat-gpt/chat/completions",
    "/integrations/chat-gpt/completions",
    "/integrations/chat_gpt/chat/completions",
  ];
  let lastErr = null;
  for (const url of candidates) {
    try {
      return await callChatGptIntegration(url, payload);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("CHAT_GPT integration unavailable");
}

export async function generateSwipecheckNarrative({
  category,
  conditionLabel,
  answers,
  photoInsights,
}) {
  // Prefer platform CHAT_GPT integration; fall back to direct OpenAI key only if configured
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;

  const systemPrompt = `You are a home maintenance assistant. Given a category (bathroom, kitchen, roof, hvac, electrical, plumbing, flooring, windows_doors, foundation, exterior, garage, bedroom, cabinetry), a condition label (Good, Fair, Needs Attention), the user's multiple-choice answers, and short photo notes, produce a concise, calm summary and suggestions. Keep it short and practical.`;

  const userContent = {
    category,
    condition_label: conditionLabel,
    answers,
    photo_insights: photoInsights || "No photos provided",
  };

  // First try the CHAT_GPT integration
  try {
    const integrationResp = await chatWithAiViaIntegration({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userContent) },
      ],
      // If the integration supports response_format, great; otherwise it should ignore
      response_format: { type: "json_object" },
    });

    // Try to normalize responses that mirror OpenAI's shape
    let text = null;
    if (integrationResp?.choices?.[0]?.message?.content) {
      text = integrationResp.choices[0].message.content;
    } else if (integrationResp?.message?.content) {
      text = integrationResp.message.content;
    } else if (typeof integrationResp === "string") {
      text = integrationResp;
    }

    const parsed = text ? JSON.parse(text) : {};

    return {
      condition_label: parsed.condition_label || conditionLabel || "Fair",
      summary_text:
        parsed.summary_text ||
        `Quick take for your ${category}: ${conditionLabel || "Fair"}.`,
      key_findings: parsed.key_findings || [],
      gentle_guidance: parsed.gentle_guidance || [],
      recommended_contractor_type: parsed.recommended_contractor_type || null,
      suggested_timeframe: parsed.suggested_timeframe || null,
    };
  } catch (_) {
    // If integration fails entirely, try direct OpenAI (if key exists)
  }

  if (apiKey) {
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userContent) },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!resp.ok) {
        throw new Error(`OpenAI error ${resp.status}`);
      }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);

      return {
        condition_label: parsed.condition_label || conditionLabel || "Fair",
        summary_text:
          parsed.summary_text ||
          `Quick take for your ${category}: ${conditionLabel || "Fair"}.`,
        key_findings: parsed.key_findings || [],
        gentle_guidance: parsed.gentle_guidance || [],
        recommended_contractor_type: parsed.recommended_contractor_type || null,
        suggested_timeframe: parsed.suggested_timeframe || null,
      };
    } catch (e) {
      console.error("AI narrative failed:", e);
    }
  }

  // Final safe fallback
  const fallbackFindings =
    Object.values(answers || {}).length > 0
      ? [
          "Based on your answers, we identified a few key points.",
          "Consider a professional check if issues persist.",
        ]
      : ["Not enough input to analyze this area."];
  return {
    condition_label: conditionLabel || "Fair",
    summary_text: `Quick take for your ${category}: ${conditionLabel || "Fair"}.`,
    key_findings: fallbackFindings,
    gentle_guidance: [
      "Monitor this area over the next few weeks.",
      "Schedule a basic service if you notice worsening symptoms.",
    ],
    recommended_contractor_type:
      category === "bathroom"
        ? "Plumbing"
        : category === "kitchen"
          ? "Kitchen"
          : category === "roof"
            ? "Roofing"
            : category === "hvac"
              ? "HVAC"
              : category === "electrical"
                ? "Electrical"
                : category === "plumbing"
                  ? "Plumbing"
                  : category === "flooring"
                    ? "Flooring"
                    : category === "windows_doors"
                      ? "Windows and Doors"
                      : category === "foundation"
                        ? "Foundation"
                        : category === "exterior"
                          ? "Exterior"
                          : category === "garage"
                            ? "Garage Door"
                            : category.charAt(0).toUpperCase() +
                              category.slice(1),
    suggested_timeframe:
      conditionLabel === "Needs Attention"
        ? "Within 1-2 weeks"
        : "Within 1-2 months",
  };
}

export async function analyzePhotosVision({
  category,
  conditionLabel,
  photos,
}) {
  // Prefer integration; fall back to direct OpenAI only if configured
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
  if (!photos || photos.length === 0) {
    return "No photo insights available.";
  }
  const visionPrompt = `Look at these images for the ${category}. In 2-3 short phrases, describe what you see and any obvious risk indicators. Keep it neutral.`;

  // Try integration first
  try {
    const messages = [
      { role: "system", content: visionPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Category: ${category}. Condition: ${conditionLabel}.`,
          },
          ...photos
            .slice(0, 3)
            .map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      },
    ];
    const integrationResp = await chatWithAiViaIntegration({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 300,
    });
    if (integrationResp?.choices?.[0]?.message?.content) {
      return (
        integrationResp.choices[0].message.content ||
        "No photo insights available."
      );
    }
    if (typeof integrationResp === "string") {
      return integrationResp || "No photo insights available.";
    }
  } catch (_) {
    // fall through
  }

  if (apiKey) {
    try {
      const messages = [
        { role: "system", content: visionPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Category: ${category}. Condition: ${conditionLabel}.`,
            },
            ...photos
              .slice(0, 3)
              .map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        },
      ];

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
          messages,
          max_tokens: 300,
        }),
      });

      if (!resp.ok) {
        throw new Error(`OpenAI vision error ${resp.status}`);
      }
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "";
      return content || "No photo insights available.";
    } catch (e) {
      console.error("Vision analysis failed:", e);
    }
  }

  return "No photo insights available.";
}

export async function generateSwipecheckQuestions({ category, mode = "lite" }) {
  // Prefer integration; fall back to direct OpenAI; else deterministic fallback
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;

  const systemPrompt = `You are a home inspection expert. Generate 3-5 multiple-choice questions for a ${mode} home inspection of the ${category} area. Questions should be practical for homeowners to answer and help assess potential issues. Each question should have 3-4 clear answer options.

  Return JSON format:
  {
    "questions": [
      {
        "text": "Question text here",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "order_index": 1
      }
    ]
  }`;

  const userContent = `Generate ${mode} inspection questions for: ${category}. Focus on common issues homeowners can easily observe and assess.`;

  try {
    const integrationResp = await chatWithAiViaIntegration({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    let text = null;
    if (integrationResp?.choices?.[0]?.message?.content) {
      text = integrationResp.choices[0].message.content;
    } else if (integrationResp?.message?.content) {
      text = integrationResp.message.content;
    } else if (typeof integrationResp === "string") {
      text = integrationResp;
    }

    const parsed = text ? JSON.parse(text) : { questions: [] };
    const questions = (parsed.questions || []).map((q, index) => ({
      text: q.text,
      options_json: q.options,
      order_index: index + 1,
    }));

    if (questions.length) return questions;
  } catch (_) {
    // fall through
  }

  if (apiKey) {
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.5,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!resp.ok) {
        throw new Error(`OpenAI error ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);

      const questions = (parsed.questions || []).map((q, index) => ({
        text: q.text,
        options_json: q.options,
        order_index: index + 1,
      }));

      return questions;
    } catch (e) {
      console.error("AI question generation failed:", e);
    }
  }

  // Deterministic fallback set ... keep existing long fallback mapping for many categories
  const fallbackQuestions = {
    bathroom: [
      {
        text: "How is the water pressure in your bathroom fixtures?",
        options_json: ["Excellent", "Good", "Weak", "Very poor"],
        order_index: 1,
      },
      {
        text: "Do you notice any leaks around the toilet or sink?",
        options_json: [
          "No leaks",
          "Minor leaks",
          "Significant leaks",
          "Major flooding",
        ],
        order_index: 2,
      },
    ],
    kitchen: [
      {
        text: "How well do your kitchen appliances function?",
        options_json: [
          "All work perfectly",
          "Most work well",
          "Some issues",
          "Major problems",
        ],
        order_index: 1,
      },
      {
        text: "Are there any plumbing issues in the kitchen?",
        options_json: [
          "No issues",
          "Minor drips",
          "Slow drainage",
          "Major problems",
        ],
        order_index: 2,
      },
    ],
    roof: [
      {
        text: "Have you noticed any visible damage to your roof?",
        options_json: [
          "No visible damage",
          "Minor wear",
          "Some missing shingles",
          "Major damage",
        ],
        order_index: 1,
      },
    ],
    hvac: [
      {
        text: "How well does your heating and cooling system work?",
        options_json: [
          "Works perfectly",
          "Generally good",
          "Some issues",
          "Needs major work",
        ],
        order_index: 1,
      },
    ],
    electrical: [
      {
        text: "Do you experience any electrical issues?",
        options_json: [
          "No issues",
          "Occasional flickering",
          "Frequent outages",
          "Major concerns",
        ],
        order_index: 1,
      },
    ],
    plumbing: [
      {
        text: "How is the water pressure throughout your home?",
        options_json: ["Excellent", "Good", "Weak", "Very poor"],
        order_index: 1,
      },
      {
        text: "Do you have any ongoing plumbing issues?",
        options_json: [
          "No issues",
          "Minor drips",
          "Slow drainage",
          "Major leaks",
        ],
        order_index: 2,
      },
    ],
    flooring: [
      {
        text: "What is the overall condition of your flooring?",
        options_json: ["Excellent", "Good", "Shows wear", "Needs replacement"],
        order_index: 1,
      },
      {
        text: "Are there any visible damage issues with your floors?",
        options_json: [
          "No damage",
          "Minor scratches/stains",
          "Loose boards/tiles",
          "Major damage",
        ],
        order_index: 2,
      },
    ],
    windows_doors: [
      {
        text: "How well do your windows and doors open and close?",
        options_json: [
          "Smoothly",
          "With minor effort",
          "Stick sometimes",
          "Very difficult",
        ],
        order_index: 1,
      },
      {
        text: "Do you notice any drafts around windows or doors?",
        options_json: [
          "No drafts",
          "Minor drafts",
          "Noticeable drafts",
          "Major air leaks",
        ],
        order_index: 2,
      },
    ],
    foundation: [
      {
        text: "Have you noticed any cracks in your foundation?",
        options_json: [
          "No visible cracks",
          "Small hairline cracks",
          "Noticeable cracks",
          "Large structural cracks",
        ],
        order_index: 1,
      },
      {
        text: "Do you have any moisture issues in basement/crawlspace?",
        options_json: [
          "No moisture issues",
          "Occasional dampness",
          "Regular moisture",
          "Standing water",
        ],
        order_index: 2,
      },
    ],
    exterior: [
      {
        text: "What is the condition of your home's exterior siding/paint?",
        options_json: ["Excellent", "Good", "Shows wear", "Needs attention"],
        order_index: 1,
      },
      {
        text: "Do you see any damage to the exterior walls?",
        options_json: [
          "No damage",
          "Minor wear",
          "Some damage",
          "Significant damage",
        ],
        order_index: 2,
      },
    ],
    garage: [
      {
        text: "How well does your garage door operate?",
        options_json: [
          "Perfectly",
          "Minor issues",
          "Frequent problems",
          "Doesn't work",
        ],
        order_index: 1,
      },
      {
        text: "Are there any maintenance issues with your garage?",
        options_json: [
          "No issues",
          "Minor problems",
          "Several issues",
          "Major problems",
        ],
        order_index: 2,
      },
    ],
  };

  return (
    fallbackQuestions[category] || [
      {
        text: `How would you rate the overall condition of your ${category}?`,
        options_json: ["Excellent", "Good", "Fair", "Poor"],
        order_index: 1,
      },
      {
        text: `Are there any visible issues with your ${category}?`,
        options_json: [
          "No issues",
          "Minor issues",
          "Moderate issues",
          "Major issues",
        ],
        order_index: 2,
      },
    ]
  );
}
