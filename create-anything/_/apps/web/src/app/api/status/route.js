import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    // Prefer CHAT_GPT integration health; fall back to env key check
    let aiConnected = false;
    let aiProvider = null;

    // Try integration health endpoint(s)
    const healthPaths = [
      "/integrations/chat-gpt/health",
      "/integrations/chat_gpt/health",
    ];
    for (const hp of healthPaths) {
      try {
        const r = await fetch(hp);
        if (r.ok) {
          aiConnected = true;
          aiProvider = "CHAT_GPT";
          break;
        }
      } catch (_) {}
    }

    // If no explicit health endpoint, try a minimal, safe ping to the chat endpoint
    if (!aiConnected) {
      const pingBodies = [
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "health-check" },
            { role: "user", content: "ping" },
          ],
          max_tokens: 1,
        },
      ];
      const pingPaths = [
        "/integrations/chat-gpt/chat/completions",
        "/integrations/chat-gpt/completions",
        "/integrations/chat_gpt/chat/completions",
      ];
      for (const body of pingBodies) {
        for (const path of pingPaths) {
          try {
            const r = await fetch(path, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (r.ok) {
              aiConnected = true;
              aiProvider = "CHAT_GPT";
              break;
            }
          } catch (_) {}
        }
        if (aiConnected) break;
      }
    }

    if (!aiConnected) {
      // Fallback: environment key presence (legacy direct OpenAI)
      const hasEnvKey = Boolean(
        process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN,
      );
      if (hasEnvKey) {
        aiConnected = true;
        aiProvider = "openai";
      }
    }

    // Check maps proxy health by calling our own autocomplete proxy with a tiny query
    let mapsProxyOk = false;
    try {
      const res = await fetch(
        `/api/google/places/autocomplete?input=Main&sessiontoken=healthcheck`,
      );
      mapsProxyOk = res.ok;
    } catch (e) {
      mapsProxyOk = false;
    }

    // Check Local Business Data integration (Nearby Pros)
    let businessDataOk = false;
    try {
      const res = await fetch(
        `/integrations/local-business-data/search?query=plumber+in+USA&limit=1&language=en&region=us`,
      );
      businessDataOk = res.ok;
    } catch (e) {
      businessDataOk = false;
    }

    // Count questions loaded in DB
    let questionsCount = 0;
    try {
      const rows =
        await sql`SELECT COUNT(*)::int AS count FROM swipecheck_questions`;
      questionsCount = rows?.[0]?.count || 0;
    } catch (e) {
      // keep 0 on failure
    }

    return Response.json({
      ai: {
        provider: aiProvider,
        connected: aiConnected,
      },
      maps_proxy: { ok: mapsProxyOk },
      business_data: { enabled: businessDataOk },
      db: { swipecheck_questions: questionsCount },
    });
  } catch (error) {
    console.error("Status endpoint error:", error);
    return Response.json({ error: "Failed to get status" }, { status: 500 });
  }
}
