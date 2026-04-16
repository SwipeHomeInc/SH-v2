import sql from "@/app/api/utils/sql";
import {
  generateSwipecheckNarrative,
  analyzePhotosVision,
} from "@/app/api/utils/ai";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get("checkId");

    if (!checkId) {
      return Response.json({ error: "Check ID is required" }, { status: 400 });
    }

    // Load the check first (without enforcing ownership yet)
    const checks = await sql`
      SELECT * FROM swipe_checks WHERE id = ${checkId}
    `;

    if (!checks.length) {
      return Response.json({ error: "Check not found" }, { status: 404 });
    }

    const check = checks[0];

    // Verify ownership: either belongs to user's property OR was created by this user (when property_id is null)
    if (check.property_id) {
      const owned = await sql`
        SELECT 1 FROM properties WHERE id = ${check.property_id} AND user_id = ${user.id}
      `;
      if (!owned.length) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
    } else {
      if (check.created_by_user_id !== user.id) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
    }

    // Does the user currently have a property? If not, contractors are locked.
    const userPropertyRows = await sql`
      SELECT * FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
    `;
    const userHasProperty = userPropertyRows.length > 0;
    const userProperty = userHasProperty ? userPropertyRows[0] : null;

    // Load photos for this check
    const photos = await sql`
      SELECT id, url, caption FROM swipecheck_photos WHERE swipecheck_id = ${checkId} ORDER BY id ASC LIMIT 5
    `;

    // If AI fields are missing and we have a key, attempt to enrich now
    if (!check.summary_text) {
      try {
        let photoInsights = null;
        if (photos.length > 0) {
          const urls = photos.map((p) => p.url);
          photoInsights = await analyzePhotosVision({
            category: check.category,
            conditionLabel: check.condition_label || check.condition,
            photos: urls,
          });
        }

        const narrative = await generateSwipecheckNarrative({
          category: check.category,
          conditionLabel: check.condition_label || check.condition,
          answers: check.answers_json,
          photoInsights: photoInsights || undefined,
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

        // refresh check
        const refreshed =
          await sql`SELECT * FROM swipe_checks WHERE id = ${checkId}`;
        if (refreshed.length) {
          Object.assign(check, refreshed[0]);
        }
      } catch (e) {
        console.error("AI enrichment failed in results:", e);
      }
    }

    // Get recommended contractors based on category (locked if user has no property)
    // Map category -> trade; include Bedroom
    const tradeMap = {
      bathroom: "Plumbing",
      kitchen: "General Contractor",
      roof: "Roofing",
      hvac: "HVAC",
      electrical: "Electrical",
      flooring: "Flooring",
      windows_doors: "General Contractor",
      foundation: "General Contractor",
      exterior: "General Contractor",
      garage: "General Contractor",
      bedroom: "General Contractor",
      cabinetry: "Cabinetry / Custom Woodworking",
    };

    const trade = check.recommended_contractor_type || tradeMap[check.category];

    // --- New: ZIP + trade matching (local vs nearby) ---
    const propertyZip = userProperty?.zip || null;
    const first3 = propertyZip ? String(propertyZip).slice(0, 3) : null;

    let allByTrade = [];
    if (trade) {
      allByTrade = await sql`
        SELECT id, name, trade, zip, phone, email, rating, is_insured, address, website
        FROM contractors 
        WHERE trade = ${trade}
        ORDER BY rating DESC NULLS LAST, name ASC
      `;
    }

    const parseZipCodes = (row) => {
      const raw = row.zip_codes || ""; // tolerate missing column
      if (typeof raw !== "string") return [];
      return raw
        .split(/[\s,]+/)
        .map((z) => z.trim())
        .filter(Boolean);
    };

    const isLocal = (row) => {
      if (!propertyZip) return false;
      if (row.zip && String(row.zip) === String(propertyZip)) return true;
      return parseZipCodes(row).includes(String(propertyZip));
    };

    const isNearby = (row) => {
      if (!first3) return false;
      const rowZip = row.zip ? String(row.zip) : "";
      if (rowZip.startsWith(first3)) return true;
      return parseZipCodes(row).some((z) => String(z).startsWith(first3));
    };

    const local_swipe_contractors = (allByTrade || [])
      .filter(isLocal)
      .slice(0, 5);
    const nearby_swipe_contractors = (allByTrade || [])
      .filter((r) => !isLocal(r) && isNearby(r))
      .slice(0, 5);

    // Nearby Pros (External) via Local Business Data integration (optional)
    let nearbyPros = [];
    if (
      userHasProperty &&
      userProperty?.latitude &&
      userProperty?.longitude &&
      trade
    ) {
      try {
        const query = `${trade} near ${userProperty.city || userProperty.zip || "USA"}`;
        const lbUrl = `/integrations/local-business-data/search?query=${encodeURIComponent(query)}&limit=5&lat=${encodeURIComponent(
          userProperty.latitude,
        )}&lng=${encodeURIComponent(userProperty.longitude)}&language=en&region=us&subtypes=${encodeURIComponent(
          trade,
        )}`;
        const lbRes = await fetch(lbUrl);
        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          const items = lbJson?.data || [];
          nearbyPros = items.slice(0, 5).map((b) => ({
            id: b.place_id || b.business_id || b.google_id,
            name: b.name,
            trade: trade,
            address: b.address || b.full_address || b.vicinity || null,
            zip: b.zipcode || null,
            phone: b.phone_number || null,
            website: b.website || null,
            source: "external",
          }));
        }
      } catch (e) {
        console.error("Nearby pros lookup failed:", e);
      }
    }

    return Response.json({
      condition: check.condition_label || check.condition,
      summary_text: check.summary_text,
      key_findings: check.key_findings_json || check.findings_json,
      gentle_guidance: check.gentle_guidance_json || [],
      recommended_contractor_type: check.recommended_contractor_type || trade,
      suggested_timeframe: check.suggested_timeframe || null,
      // expose grouped matches even if locked; front-end will gate contact details
      local_swipe_contractors,
      nearby_swipe_contractors,
      photos: photos,
      unlock_required: !userHasProperty,
      nearby_pros: userHasProperty ? nearbyPros : [],
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return Response.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
