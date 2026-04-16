import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.email) {
      return Response.json({ leadExists: false });
    }

    const rows = await sql`
      SELECT 1 FROM contractor_leads WHERE email = ${user.email} LIMIT 1
    `;

    return Response.json({ leadExists: rows.length > 0 });
  } catch (error) {
    console.error("Error checking contractor lead:", error);
    return Response.json({ leadExists: false });
  }
}
