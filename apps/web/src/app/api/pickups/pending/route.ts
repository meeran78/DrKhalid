import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT spr.id, spr.open_shift_request_id, spr.requested_by_physician_id, spr.status, spr.created_at,
           p.name as physician_name, s.start_time, s.end_time, s.type, sch.name as schedule_name
    FROM shift_pickup_requests spr
    JOIN physicians p ON p.id = spr.requested_by_physician_id
    JOIN open_shift_requests osr ON osr.id = spr.open_shift_request_id
    JOIN shifts s ON s.id = osr.shift_id
    JOIN schedules sch ON sch.id = s.schedule_id
    WHERE spr.status = 'pending'
    ORDER BY spr.created_at
  `;

  return NextResponse.json({
    pendingPickups: rows.map((r) => ({
      id: r.id,
      openShiftRequestId: r.open_shift_request_id,
      requestedByPhysicianId: r.requested_by_physician_id,
      physicianName: r.physician_name,
      startTime: r.start_time,
      endTime: r.end_time,
      type: r.type,
      scheduleName: r.schedule_name,
      createdAt: r.created_at,
    })),
  });
}
