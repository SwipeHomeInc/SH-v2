import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We'll delete only data the current user owns.
    // Order matters due to FKs: photos -> checks -> didpids -> properties
    let photosDeleted = 0;
    let checksDeleted = 0;
    let didpidsDeleted = 0;
    let propertiesDeleted = 0;
    let contractorLeadsDeleted = 0;

    // swipecheck_photos tied to user's checks or properties
    const photos = await sql(
      `
      DELETE FROM swipecheck_photos
      WHERE swipecheck_id IN (
        SELECT id FROM swipe_checks
        WHERE created_by_user_id = $1
           OR property_id IN (SELECT id FROM properties WHERE user_id = $1)
      )
      RETURNING id
    `,
      [user.id],
    );
    photosDeleted = photos.length || 0;

    // swipe_checks created by user or tied to user's properties
    const checks = await sql(
      `
      DELETE FROM swipe_checks
      WHERE created_by_user_id = $1
         OR property_id IN (SELECT id FROM properties WHERE user_id = $1)
      RETURNING id
    `,
      [user.id],
    );
    checksDeleted = checks.length || 0;

    // didpids for user's properties
    const didpids = await sql(
      `
      DELETE FROM didpids
      WHERE property_id IN (SELECT id FROM properties WHERE user_id = $1)
      RETURNING id
    `,
      [user.id],
    );
    didpidsDeleted = didpids.length || 0;

    // properties owned by user
    const props = await sql(
      `
      DELETE FROM properties
      WHERE user_id = $1
      RETURNING id
    `,
      [user.id],
    );
    propertiesDeleted = props.length || 0;

    // Optional: clear contractor leads matching this user's email (helps reset flows)
    if (user.email) {
      const leads = await sql(
        `
        DELETE FROM contractor_leads
        WHERE LOWER(email) = LOWER($1)
        RETURNING id
      `,
        [user.email],
      );
      contractorLeadsDeleted = leads.length || 0;
    }

    return Response.json({
      ok: true,
      deleted: {
        swipecheck_photos: photosDeleted,
        swipe_checks: checksDeleted,
        didpids: didpidsDeleted,
        properties: propertiesDeleted,
        contractor_leads: contractorLeadsDeleted,
      },
    });
  } catch (error) {
    console.error("reset-my-data error", error);
    return Response.json(
      { error: "Failed to reset your data" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  // Convenience: allow a dry-run preview of what would be deleted (counts only)
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ count: photo_count }] = await sql(
      `
      SELECT COUNT(*)::int as count FROM swipecheck_photos
      WHERE swipecheck_id IN (
        SELECT id FROM swipe_checks
        WHERE created_by_user_id = $1
           OR property_id IN (SELECT id FROM properties WHERE user_id = $1)
      )
    `,
      [user.id],
    );

    const [{ count: checks_count }] = await sql(
      `
      SELECT COUNT(*)::int as count FROM swipe_checks
      WHERE created_by_user_id = $1
         OR property_id IN (SELECT id FROM properties WHERE user_id = $1)
    `,
      [user.id],
    );

    const [{ count: didpids_count }] = await sql(
      `
      SELECT COUNT(*)::int as count FROM didpids
      WHERE property_id IN (SELECT id FROM properties WHERE user_id = $1)
    `,
      [user.id],
    );

    const [{ count: properties_count }] = await sql(
      `
      SELECT COUNT(*)::int as count FROM properties
      WHERE user_id = $1
    `,
      [user.id],
    );

    let contractor_leads_count = 0;
    if (user.email) {
      const [{ count }] = await sql(
        `
        SELECT COUNT(*)::int as count FROM contractor_leads
        WHERE LOWER(email) = LOWER($1)
      `,
        [user.email],
      );
      contractor_leads_count = count;
    }

    return Response.json({
      ok: true,
      preview: {
        swipecheck_photos: photo_count,
        swipe_checks: checks_count,
        didpids: didpids_count,
        properties: properties_count,
        contractor_leads: contractor_leads_count,
      },
    });
  } catch (error) {
    console.error("reset-my-data preview error", error);
    return Response.json({ error: "Failed to preview reset" }, { status: 500 });
  }
}
