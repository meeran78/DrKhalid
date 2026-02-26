import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await sql`
    SELECT osr.id, osr.shift_id, osr.dropped_by_physician_id, osr.status, osr.created_at,
           s.start_time, s.end_time, s.type, s.location, sch.name as schedule_name,
           p.name as dropped_by_name
    FROM open_shift_requests osr
    JOIN shifts s ON s.id = osr.shift_id
    JOIN schedules sch ON sch.id = s.schedule_id
    JOIN physicians p ON p.id = osr.dropped_by_physician_id
    WHERE osr.status = 'open' AND sch.status = 'published'
    ORDER BY s.start_time
  `;
  return NextResponse.json({
    openShifts: rows.map((r) => ({
      id: r.id,
      shiftId: r.shift_id,
      droppedByPhysicianId: r.dropped_by_physician_id,
      status: r.status,
      createdAt: r.created_at,
      startTime: r.start_time,
      endTime: r.end_time,
      type: r.type,
      location: r.location,
      scheduleName: r.schedule_name,
      droppedByName: r.dropped_by_name,
    })),
  });
}
