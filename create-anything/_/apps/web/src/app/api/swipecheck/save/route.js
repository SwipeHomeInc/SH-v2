export async function POST(request) {
  try {
    const body = await request.json();
    const { checkId } = body;

    if (!checkId) {
      return Response.json({ error: "Check ID is required" }, { status: 400 });
    }

    // In MVP, the check is already saved to the database
    // This endpoint just confirms the user wants to keep it
    // In a full version, this might update a status or send notifications

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving check:", error);
    return Response.json({ error: "Failed to save check" }, { status: 500 });
  }
}
