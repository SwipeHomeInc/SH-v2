import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, company, email, phone, trade, zip, notes } = body;

    if (!name || !email || !trade || !zip) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO contractor_leads (name, company, email, phone, trade, zip, notes)
      VALUES (${name}, ${company || null}, ${email}, ${phone || null}, ${trade}, ${zip}, ${notes || null})
      RETURNING id
    `;

    return Response.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Error creating contractor lead:", error);
    return Response.json(
      { error: "Failed to create contractor lead" },
      { status: 500 },
    );
  }
}
