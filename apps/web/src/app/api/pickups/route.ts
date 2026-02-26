import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";
import { validatePickup } from "@/lib/conflicts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfile();
  const physicianRows = await sql`SELECT id FROM physicians WHERE user_id = ${profile!.user_id}`;
  const physician = physicianRows[0];
  if (!physician) {
    return NextResponse.json({ error: "Physician profile required" }, { status: 403 });
  }

  const body = await req.json();
  const { openShiftRequestId } = body;
  if (!openShiftRequestId) {
    return NextResponse.json({ error: "openShiftRequestId required" }, { status: 400 });
  }

  const osrRows = await sql`
    SELECT osr.id, osr.shift_id, osr.status, s.start_time, s.end_time, sch.status as schedule_status
    FROM open_shift_requests osr
    JOIN shifts s ON s.id = osr.shift_id
    JOIN schedules sch ON sch.id = s.schedule_id
    WHERE osr.id = ${openShiftRequestId}
  `;
  const osr = osrRows[0];
  if (!osr) return NextResponse.json({ error: "Open shift request not found" }, { status: 404 });
  if (osr.status !== "open") {
    return NextResponse.json({ error: "Shift is no longer available" }, { status: 400 });
  }
  if (osr.schedule_status !== "published") {
    return NextResponse.json({ error: "Can only pick up shifts from published schedules" }, { status: 400 });
  }

  const validation = await validatePickup(
    physician.id,
    osr.start_time,
    osr.end_time
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await sql`
    SELECT id FROM shift_pickup_requests
    WHERE open_shift_request_id = ${openShiftRequestId} AND requested_by_physician_id = ${physician.id} AND status = 'pending'
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "You already requested this shift" }, { status: 400 });
  }

  await sql`
    INSERT INTO shift_pickup_requests (open_shift_request_id, requested_by_physician_id, status)
    VALUES (${openShiftRequestId}, ${physician.id}, 'pending'::pickup_status)
  `;
  const { notifyAdmins } = await import("@/lib/notify");
  const physRows = await sql`SELECT name FROM physicians WHERE id = ${physician.id}`;
  await notifyAdmins("pickup_request", "Pickup requested", `${physRows[0]?.name || "A physician"} requested to pick up a shift.`);
  return NextResponse.json({ ok: true });
}
