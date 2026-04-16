import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

export async function GET(request, { params: { id } }) {
  try {
    // Guard: reject non-numeric IDs early
    if (!/^\d+$/.test(id)) {
      return Response.json({ error: "Invalid contractor ID" }, { status: 400 });
    }

    const user = await getAuthUser(request);

    // Determine unlock for contact fields (user has at least one property)
    let hasProperty = false;
    if (user && user.id) {
      const prop =
        await sql`SELECT 1 FROM properties WHERE user_id = ${user.id} LIMIT 1`;
      hasProperty = prop.length > 0;
    }

    // Fetch contractor with new optional fields and a primary photo
    const rows = await sql`
      SELECT 
        c.id, c.name, c.trade, c.zip, c.phone, c.email,
        c.address, c.rating, c.is_insured, c.website,
        (
          SELECT url FROM contractor_photos p 
          WHERE p.contractor_id = c.id 
          ORDER BY p.id ASC LIMIT 1
        ) AS photo_url
      FROM contractors c
      WHERE c.id = ${id} 
      LIMIT 1
    `;

    if (!rows.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const c = rows[0];

    // Only expose contact when unlocked
    const phone = hasProperty ? c.phone : null;
    const email = hasProperty ? c.email : null;

    // Fallbacks to keep UI friendly during demo if DB values are missing
    const rating = c.rating ?? null; // keep null if not set in DB
    const insured = c.is_insured ?? null; // explicitly null if unknown
    const address = c.address ?? null;

    // rough-in socials shape from website only for now
    const socials = c.website ? { website: c.website } : null;

    return Response.json({
      id: c.id,
      name: c.name,
      trade: c.trade,
      zip: c.zip,
      phone,
      email,
      rating,
      address,
      insured,
      photo_url: c.photo_url || null,
      socials,
      contact_unlocked: hasProperty,
    });
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return Response.json(
      { error: "Failed to fetch contractor" },
      { status: 500 },
    );
  }
}
