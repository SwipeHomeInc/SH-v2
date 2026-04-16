import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { address, unit, city, state, zip, latitude, longitude } = body;

    if (!address || !city || !state || !zip) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Require authentication to tie property to the current user
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate DIDPID code (simple format: SHOME-XXXXX)
    const didpidCode = `SHOME-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}${Date.now().toString(36).toUpperCase().slice(-3)}`;

    // Create property and DIDPID in transaction
    const [propertyResult, didpidResult] = await sql.transaction([
      sql`
        INSERT INTO properties (user_id, address, unit, city, state, zip, latitude, longitude)
        VALUES (${user.id}, ${address}, ${unit || null}, ${city}, ${state}, ${zip}, ${latitude || null}, ${longitude || null})
        RETURNING *
      `,
      sql`
        INSERT INTO didpids (property_id, didpid_code)
        SELECT id, ${didpidCode} FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
        RETURNING *
      `,
    ]);

    return Response.json({
      property: propertyResult[0],
      didpid: didpidResult[0],
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return Response.json(
      { error: "Failed to create property" },
      { status: 500 },
    );
  }
}
