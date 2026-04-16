/**
 * Backend proxy for Google Geocoding API
 * Keeps API key secure on server side
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return Response.json(
        { error: "Address parameter required" },
        { status: 400 },
      );
    }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      return Response.json(
        { error: "Google Maps API key not configured" },
        { status: 500 },
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API returned ${response.status}`);
    }

    const data = await response.json();

    // Return just the location if found, or empty object
    const location = data.results?.[0]?.geometry?.location;
    if (location) {
      return Response.json({
        latitude: location.lat,
        longitude: location.lng,
      });
    }

    return Response.json({});
  } catch (error) {
    console.error("Geocoding error:", error);
    return Response.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
