import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get most recent property for this user with DIDPID and last check info
    const result = await sql`
      SELECT 
        p.*,
        d.didpid_code,
        sc.created_at as last_check
      FROM properties p
      LEFT JOIN didpids d ON d.property_id = p.id
      LEFT JOIN LATERAL (
        SELECT created_at 
        FROM swipe_checks 
        WHERE property_id = p.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) sc ON true
      WHERE p.user_id = ${user.id}
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return Response.json(null);
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error fetching property:", error);
    return Response.json(
      { error: "Failed to fetch property" },
      { status: 500 },
    );
  }
}
