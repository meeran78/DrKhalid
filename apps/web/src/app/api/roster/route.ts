import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`
    SELECT s.id, s.start_time, s.end_time, s.type, p.name as physician_name
    FROM shifts s
    LEFT JOIN physicians p ON p.id = s.physician_id
    JOIN schedules sch ON sch.id = s.schedule_id
    WHERE sch.status = 'published' AND s.end_time >= NOW()
    ORDER BY s.start_time
  `;
  return NextResponse.json({
    shifts: rows.map((r) => ({
      id: r.id,
      physicianName: r.physician_name,
      startTime: r.start_time,
      endTime: r.end_time,
      type: r.type,
    })),
  });
}
