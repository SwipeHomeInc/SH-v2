import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only users who own at least one property (homeowners) can access the contractors list
    const propertyRows = await sql`
      SELECT * FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
    `;
    const hasProperty = propertyRows.length > 0;

    if (!hasProperty) {
      return Response.json(
        {
          error:
            "Contractor directory is available after you add your home (DIDPID).",
        },
        { status: 403 },
      );
    }

    const property = propertyRows[0];
    const propertyZip = property?.zip || null;
    const first3 = propertyZip ? String(propertyZip).slice(0, 3) : null;

    const all = await sql`
      SELECT id, name, trade, zip, phone, email, rating, is_insured, address, website
      FROM contractors
      ORDER BY rating DESC NULLS LAST, name ASC
    `;

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

    const local_swipe_contractors = (all || []).filter(isLocal).slice(0, 20);
    const nearby_swipe_contractors = (all || [])
      .filter((r) => !isLocal(r) && isNearby(r))
      .slice(0, 20);

    return Response.json({ local_swipe_contractors, nearby_swipe_contractors });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return Response.json(
      { error: "Failed to fetch contractors" },
      { status: 500 },
    );
  }
}
