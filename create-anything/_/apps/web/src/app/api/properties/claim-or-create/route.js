import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

function generateDidpid() {
  return `SHOME-${Math.random().toString(36).substring(2, 7).toUpperCase()}${Date.now()
    .toString(36)
    .toUpperCase()
    .slice(-3)}`;
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      address, // street address only
      unit,
      city,
      state,
      postal_code, // may be sent as postal_code
      zip, // or legacy "zip"
      latitude,
      longitude,
      formatted_address, // optional, for display only
    } = body;

    const zipCode = postal_code || zip;

    if (!address || !city || !state || !zipCode) {
      return Response.json(
        { error: "Missing required address fields" },
        { status: 400 },
      );
    }

    // Try to find exact property match by street+city+state+zip
    const existing = await sql`
      SELECT * FROM properties
      WHERE address = ${address} AND city = ${city} AND state = ${state} AND zip = ${zipCode}
      LIMIT 1
    `;

    let propertyRow;

    if (existing.length) {
      const prop = existing[0];

      if (prop.user_id && prop.user_id !== user.id) {
        return Response.json(
          { error: "This property has already been claimed." },
          { status: 409 },
        );
      }

      if (!prop.user_id) {
        // Claim it for this user (and update lat/lng if provided)
        const updated = await sql`
          UPDATE properties
          SET user_id = ${user.id}, latitude = ${latitude || null}, longitude = ${longitude || null}
          WHERE id = ${prop.id}
          RETURNING *
        `;
        propertyRow = updated[0];
      } else {
        // Already owned by this user; return as-is
        propertyRow = prop;
      }

      // Ensure DIDPID exists
      const did = await sql`
        SELECT * FROM didpids WHERE property_id = ${propertyRow.id} LIMIT 1
      `;
      if (!did.length) {
        const code = generateDidpid();
        await sql`
          INSERT INTO didpids (property_id, didpid_code) VALUES (${propertyRow.id}, ${code})
        `;
      }
    } else {
      // Create new property and DIDPID inside a transaction
      const [insertedProps, insertedDid] = await sql.transaction([
        sql`
          INSERT INTO properties (user_id, address, unit, city, state, zip, latitude, longitude)
          VALUES (${user.id}, ${address}, ${unit || null}, ${city}, ${state}, ${zipCode}, ${latitude || null}, ${longitude || null})
          RETURNING *
        `,
        sql`
          INSERT INTO didpids (property_id, didpid_code)
          SELECT id, ${generateDidpid()} FROM properties ORDER BY id DESC LIMIT 1
          RETURNING *
        `,
      ]);

      propertyRow = insertedProps[0];
    }

    // Load final didpid code to return with property
    const didpid = await sql`
      SELECT didpid_code FROM didpids WHERE property_id = ${propertyRow.id} LIMIT 1
    `;

    const response = {
      property: propertyRow,
      didpid: didpid.length ? didpid[0] : null,
      formatted_address:
        formatted_address ||
        `${propertyRow.address}${propertyRow.unit ? ", " + propertyRow.unit : ""}, ${propertyRow.city}, ${propertyRow.state} ${propertyRow.zip}`,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error claiming/creating property:", error);
    return Response.json(
      { error: "Failed to claim or create property" },
      { status: 500 },
    );
  }
}
