import { availableSlots } from "@/lib/actions/booking";

/**
 * GET /api/slots?doctorId=…&date=YYYY-MM-DD&mode=IN_PERSON|VIDEO
 * Returns the bookable time slots for a doctor on a given date.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId") ?? "";
  const date = searchParams.get("date") ?? "";
  const mode = searchParams.get("mode") ?? "IN_PERSON";

  if (!doctorId || !date) {
    return Response.json({ error: "doctorId and date are required" }, { status: 400 });
  }
  if (mode !== "IN_PERSON" && mode !== "VIDEO") {
    return Response.json({ error: "Invalid mode" }, { status: 400 });
  }

  try {
    const slots = await availableSlots(doctorId, date, mode);
    return Response.json({ slots });
  } catch {
    return Response.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
