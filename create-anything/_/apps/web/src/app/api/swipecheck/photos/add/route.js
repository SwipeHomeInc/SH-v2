import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { checkId, url, caption, category } = body;

    if (!checkId || !url) {
      return Response.json(
        { error: "checkId and url are required" },
        { status: 400 },
      );
    }

    // verify ownership of the swipecheck:
    //  - if the check is tied to a property, the property must be owned by the user
    //  - if the check has no property, it must have been created by this user
    const owned = await sql`
      SELECT 1
      FROM swipe_checks sc
      LEFT JOIN properties p ON p.id = sc.property_id
      WHERE sc.id = ${checkId}
        AND (
          (sc.property_id IS NOT NULL AND p.user_id = ${user.id}) OR
          (sc.property_id IS NULL AND sc.created_by_user_id = ${user.id})
        )
    `;

    if (!owned.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // enforce max 5 photos per check
    const existing =
      await sql`SELECT COUNT(1) as c FROM swipecheck_photos WHERE swipecheck_id = ${checkId}`;
    const count = Number(existing[0].c || 0);
    if (count >= 5) {
      return Response.json(
        { error: "Maximum of 5 photos reached" },
        { status: 400 },
      );
    }

    const inserted = await sql`
      INSERT INTO swipecheck_photos (swipecheck_id, category, url, caption)
      VALUES (${checkId}, ${category || null}, ${url}, ${caption || null})
      RETURNING id
    `;

    return Response.json({
      success: true,
      id: inserted[0].id,
      total: count + 1,
    });
  } catch (error) {
    console.error("Error adding photo:", error);
    return Response.json({ error: "Failed to add photo" }, { status: 500 });
  }
}
