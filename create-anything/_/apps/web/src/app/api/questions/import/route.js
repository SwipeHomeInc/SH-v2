import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/auth";

// Accepts JSON body: { items: [{ category, mode, order_index, text, options }], replace?: boolean }
export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return Response.json(
        { error: "Body must be { items: [...] }" },
        { status: 400 },
      );
    }

    const replace = Boolean(body.replace);
    const items = body.items
      .map((q) => ({
        category: String(q.category || "")
          .trim()
          .toLowerCase(),
        mode: String(q.mode || "lite")
          .trim()
          .toLowerCase(),
        order_index: Number(q.order_index || 0),
        text: String(q.text || "").trim(),
        options: Array.isArray(q.options) ? q.options : [],
      }))
      .filter((q) => q.category && q.text && q.order_index > 0);

    if (items.length === 0) {
      return Response.json(
        { error: "No valid items provided" },
        { status: 400 },
      );
    }

    const pairs = Array.from(
      new Set(items.map((q) => `${q.category}|${q.mode}`)),
    ).map((s) => s.split("|"));

    await sql.transaction((txn) => [
      // optional deletes per category+mode
      ...(replace
        ? pairs.map(
            ([cat, mode]) =>
              txn`DELETE FROM swipecheck_questions WHERE category = ${cat} AND mode = ${mode}`,
          )
        : []),
      // inserts
      ...items.map(
        (q) =>
          txn`INSERT INTO swipecheck_questions (category, mode, order_index, text, options_json)
            VALUES (${q.category}, ${q.mode}, ${q.order_index}, ${q.text}, ${JSON.stringify(
              q.options,
            )}::jsonb)`,
      ),
    ]);

    // Return counts by pair
    const results = [];
    for (const [cat, mode] of pairs) {
      const rows =
        await sql`SELECT COUNT(*)::int AS count FROM swipecheck_questions WHERE category = ${cat} AND mode = ${mode}`;
      results.push({ category: cat, mode, count: rows?.[0]?.count || 0 });
    }

    return Response.json({ ok: true, loaded: items.length, results });
  } catch (error) {
    console.error("Questions import failed:", error);
    return Response.json(
      { error: "Failed to import questions" },
      { status: 500 },
    );
  }
}
