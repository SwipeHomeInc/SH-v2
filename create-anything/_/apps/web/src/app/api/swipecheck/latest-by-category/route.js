import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ checks: [] }, { status: 200 });
    }

    // Determine latest property for this user
    const props = await sql`
      SELECT id FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
    `;
    if (props.length === 0) {
      return Response.json({ checks: [] });
    }
    const propertyId = props[0].id;

    // Latest per category for this property (lite mode)
    const rows = await sql`
      SELECT DISTINCT ON (category)
        id, category, condition_label, condition, created_at
      FROM swipe_checks
      WHERE property_id = ${propertyId} AND mode = 'lite'
      ORDER BY category ASC, created_at DESC
    `;

    // Attach one thumbnail per check if exists
    const results = [];
    for (const r of rows) {
      const photos = await sql`
        SELECT url FROM swipecheck_photos WHERE swipecheck_id = ${r.id} ORDER BY id ASC LIMIT 1
      `;
      results.push({
        id: r.id,
        category: r.category,
        condition: r.condition_label || r.condition,
        created_at: r.created_at,
        thumb_url: photos.length ? photos[0].url : null,
      });
    }

    return Response.json({ checks: results });
  } catch (error) {
    console.error("Error fetching latest by category:", error);
    return Response.json(
      { error: "Failed to fetch latest checks" },
      { status: 500 },
    );
  }
}
