import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

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
  const { shiftId } = body;
  if (!shiftId) {
    return NextResponse.json({ error: "shiftId required" }, { status: 400 });
  }

  const shiftRows = await sql`
    SELECT s.id, s.physician_id, s.start_time, s.end_time, sch.status as schedule_status
    FROM shifts s JOIN schedules sch ON sch.id = s.schedule_id
    WHERE s.id = ${shiftId}
  `;
  const shift = shiftRows[0];
  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  if (shift.physician_id !== physician.id) {
    return NextResponse.json({ error: "You can only drop your own shift" }, { status: 403 });
  }
  if (shift.schedule_status !== "published") {
    return NextResponse.json({ error: "Can only drop shifts from published schedules" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id FROM open_shift_requests WHERE shift_id = ${shiftId} AND status = 'open'
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Shift already dropped and open" }, { status: 400 });
  }

  await sql`UPDATE shifts SET physician_id = NULL WHERE id = ${shiftId}`;
  const inserted = await sql`
    INSERT INTO open_shift_requests (shift_id, dropped_by_physician_id, status)
    VALUES (${shiftId}, ${physician.id}, 'open'::open_shift_status)
    RETURNING id
  `;
  await sql`
    INSERT INTO roster_events (event_type, entity_id, payload)
    VALUES ('drop'::roster_event_type, ${inserted[0].id}, ${JSON.stringify({ shiftId, physicianId: physician.id })}::jsonb)
  `;
  const { notifyPhysicians, notifyAdmins } = await import("@/lib/notify");
  const nameRows = await sql`SELECT name FROM physicians WHERE id = ${physician.id}`;
  const name = nameRows[0]?.name || "A physician";
  await notifyPhysicians("open_shift", "New open shift", `${name} dropped a shift. Check open shifts to pick it up.`);
  await notifyAdmins("open_shift", "Shift dropped", `${name} dropped a shift.`);

  return NextResponse.json({ ok: true });
}
