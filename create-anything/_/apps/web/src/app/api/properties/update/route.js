import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, bedrooms, bathrooms, square_feet, year_built } = body;

    // Use the latest property for this user if id not provided
    let propertyId = id;
    if (!propertyId) {
      const props = await sql`
        SELECT id FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
      `;
      if (props.length === 0) {
        return Response.json(
          { error: "No property to update" },
          { status: 400 },
        );
      }
      propertyId = props[0].id;
    }

    // Build dynamic SET clause
    const sets = [];
    const values = [];
    let idx = 1;

    if (bedrooms !== undefined) {
      sets.push(`bedrooms = $${idx++}`);
      values.push(bedrooms);
    }
    if (bathrooms !== undefined) {
      sets.push(`bathrooms = $${idx++}`);
      values.push(bathrooms);
    }
    if (square_feet !== undefined) {
      sets.push(`square_feet = $${idx++}`);
      values.push(square_feet);
    }
    if (year_built !== undefined) {
      sets.push(`year_built = $${idx++}`);
      values.push(year_built);
    }

    if (sets.length === 0) {
      return Response.json({ success: true });
    }

    // Enforce ownership in the WHERE clause
    const query = `UPDATE properties SET ${sets.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
    values.push(propertyId, user.id);

    const updated = await sql(query, values);
    if (!updated.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ property: updated[0] });
  } catch (error) {
    console.error("Error updating property:", error);
    return Response.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}
