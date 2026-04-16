export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input") || "";
    const sessiontoken = searchParams.get("sessiontoken") || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const key =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      return Response.json(
        { error: "Google Maps API key is not configured on the server" },
        { status: 500 },
      );
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", input);
    url.searchParams.set("types", "address");
    url.searchParams.set("components", "country:us");
    if (sessiontoken) url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error_message || "Autocomplete failed", data },
        { status: res.status },
      );
    }

    return Response.json(data);
  } catch (e) {
    console.error("/api/google/places/autocomplete error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// Accept POST as well for flexibility (mobile/web clients)
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = body.input || "";
    const sessiontoken = body.sessiontoken || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const key =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      return Response.json(
        { error: "Google Maps API key is not configured on the server" },
        { status: 500 },
      );
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", input);
    url.searchParams.set("types", "address");
    url.searchParams.set("components", "country:us");
    if (sessiontoken) url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error_message || "Autocomplete failed", data },
        { status: res.status },
      );
    }

    return Response.json(data);
  } catch (e) {
    console.error("/api/google/places/autocomplete POST error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
