export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const place_id = searchParams.get("place_id");
    const fields =
      searchParams.get("fields") ||
      "address_component,geometry,formatted_address";
    const sessiontoken = searchParams.get("sessiontoken") || "";

    if (!place_id) {
      return Response.json({ error: "Missing place_id" }, { status: 400 });
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
      "https://maps.googleapis.com/maps/api/place/details/json",
    );
    url.searchParams.set("place_id", place_id);
    url.searchParams.set("fields", fields);
    if (sessiontoken) url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error_message || "Place details failed", data },
        { status: res.status },
      );
    }

    return Response.json(data);
  } catch (e) {
    console.error("/api/google/places/details error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// Accept POST as well for flexibility (mobile/web clients)
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const place_id = body.place_id;
    const fields =
      body.fields || "address_component,geometry,formatted_address";
    const sessiontoken = body.sessiontoken || "";

    if (!place_id) {
      return Response.json({ error: "Missing place_id" }, { status: 400 });
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
      "https://maps.googleapis.com/maps/api/place/details/json",
    );
    url.searchParams.set("place_id", place_id);
    url.searchParams.set("fields", fields);
    if (sessiontoken) url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error_message || "Place details failed", data },
        { status: res.status },
      );
    }

    return Response.json(data);
  } catch (e) {
    console.error("/api/google/places/details POST error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
