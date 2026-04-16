import sql from "@/app/api/utils/sql";
import { generateSwipecheckNarrative, analyzePhotosVision } from "@/app/api/utils/ai";
import { getAuthUser } from "@/app/api/utils/auth";

// Simple scoring logic for MVP
function calculateCondition(answers) {
  const values = Object.values(answers);
  const negativeKeywords = [
    "yes",
    "leak",
    "damage",
    "mold",
    "issue",
    "slow",
    "frequently",
    "10+",
    "unknown",
    "unable",
  ];

  let negativeCount = 0;
  values.forEach((answer) => {
    const lowerAnswer = String(answer).toLowerCase();
    if (negativeKeywords.some((keyword) => lowerAnswer.includes(keyword))) {
      negativeCount++;
    }
  });

  const ratio = values.length ? negativeCount / values.length : 0;

  if (ratio > 0.5) return "Needs Attention";
  if (ratio > 0.2) return "Fair";
  return "Good";
}

function generateFindings(category, answers, condition) {
  const findings = [];

  if (condition === "Good") {
    findings.push(`Your ${category} appears to be in good working condition`);
    findings.push("No major concerns identified during this check");
  } else if (condition === "Fair") {
    findings.push(`Some minor issues detected in your ${category}`);
    findings.push("Consider scheduling a professional inspection soon");
    findings.push("Regular maintenance recommended");
  } else {
    findings.push(`Multiple concerns identified in your ${category}`);
    findings.push("Professional inspection strongly recommended");
    findings.push("Address these issues promptly to prevent further damage");
  }

  return findings;
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, answers, mode = "lite" } = body;

    if (!category || !answers) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get most recent property for this user (optional for contractors)
    const properties = await sql`
      SELECT id FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
    `;

    // If the user doesn't have a property, allow a null property_id so contractors can still run SwipeCheck Lite
    const propertyId = properties.length ? properties[0].id : null;

    // Calculate condition and basic findings (fallbacks)
    const condition = calculateCondition(answers);
    const basicFindings = generateFindings(category, answers, condition);

    // Insert initial check row (always create a fresh record)
    const inserted = await sql`
      INSERT INTO swipe_checks (
        property_id, category, mode, answers_json, condition, condition_label, findings_json, created_by_user_id
      ) VALUES (
        ${propertyId}, ${category}, ${mode}, ${JSON.stringify(answers)}, ${condition}, ${condition}, ${JSON.stringify(basicFindings)}, ${user.id}
      ) RETURNING id
    `;

    const checkId = inserted[0].id;

    // Try AI narrative (optional, will fallback gracefully)
    try {
      // Fetch any photos already attached to this check
      const photoRows = await sql`
        SELECT url FROM swipecheck_photos WHERE swipecheck_id = ${checkId} ORDER BY created_at
      `
      const photoUrls = photoRows.map((r) => r.url)

      // Run photo vision if photos exist, otherwise skip
      const photoInsights = photoUrls.length
        ? await analyzePhotosVision({ category, conditionLabel: condition, photos: photoUrls })
        : "No photos provided for this check."

      const narrative = await generateSwipecheckNarrative({
        category,
        conditionLabel: condition,
        answers,
        photoInsights,
      });

      await sql`
        UPDATE swipe_checks
        SET 
          condition_label = ${narrative.condition_label},
          summary_text = ${narrative.summary_text},
          key_findings_json = ${JSON.stringify(narrative.key_findings || [])}::jsonb,
          gentle_guidance_json = ${JSON.stringify(narrative.gentle_guidance || [])}::jsonb,
          recommended_contractor_type = ${narrative.recommended_contractor_type},
          suggested_timeframe = ${narrative.suggested_timeframe},
          updated_at = now()
        WHERE id = ${checkId}
      `;
    } catch (e) {
      console.error("AI narrative generation error (deferred):", e);
    }

    return Response.json({ checkId });
  } catch (error) {
    console.error("Error submitting check:", error);
    return Response.json({ error: "Failed to submit check" }, { status: 500 });
  }
}
