import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");
  const physicianId = searchParams.get("physicianId");
  const scopeAll = searchParams.get("scope") === "all";
  const profile = await getProfile();
  const isPhysician = profile?.role === "physician";

  let rows;
  if (physicianId) {
    rows = await sql`
      SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location,
             sch.name as schedule_name, p.name as physician_name
      FROM shifts s
      JOIN schedules sch ON sch.id = s.schedule_id
      LEFT JOIN physicians p ON p.id = s.physician_id
      WHERE s.physician_id = ${physicianId}
      ORDER BY s.start_time
    `;
  } else if (scheduleId) {
    rows = await sql`
      SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location,
             sch.name as schedule_name, p.name as physician_name
      FROM shifts s
      JOIN schedules sch ON sch.id = s.schedule_id
      LEFT JOIN physicians p ON p.id = s.physician_id
      WHERE s.schedule_id = ${scheduleId}
      ORDER BY s.start_time
    `;
  } else if (isPhysician && scopeAll) {
    rows = await sql`
      SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location,
             sch.name as schedule_name, p.name as physician_name
      FROM shifts s
      JOIN schedules sch ON sch.id = s.schedule_id
      LEFT JOIN physicians p ON p.id = s.physician_id
      WHERE sch.status = 'published' AND s.physician_id IS NOT NULL
      ORDER BY s.start_time
    `;
  } else if (isPhysician) {
    const physicianRows = await sql`SELECT id FROM physicians WHERE user_id = ${profile!.user_id}`;
    const physician = physicianRows[0];
    if (!physician) {
      return NextResponse.json({ shifts: [] });
    }
    rows = await sql`
      SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location,
             sch.name as schedule_name, p.name as physician_name
      FROM shifts s
      JOIN schedules sch ON sch.id = s.schedule_id
      LEFT JOIN physicians p ON p.id = s.physician_id
      WHERE s.physician_id = ${physician.id} AND sch.status = 'published'
      ORDER BY s.start_time
    `;
  } else {
    rows = await sql`
      SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location,
             sch.name as schedule_name, p.name as physician_name
      FROM shifts s
      JOIN schedules sch ON sch.id = s.schedule_id
      LEFT JOIN physicians p ON p.id = s.physician_id
      ORDER BY s.start_time
    `;
  }

  return NextResponse.json({
    shifts: rows.map((r) => ({
      id: r.id,
      scheduleId: r.schedule_id,
      physicianId: r.physician_id,
      startTime: r.start_time,
      endTime: r.end_time,
      type: r.type,
      location: r.location,
      scheduleName: r.schedule_name,
      physicianName: r.physician_name,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { scheduleId, physicianId, startTime, endTime, type, location } = body;
  if (!scheduleId || !startTime || !endTime) {
    return NextResponse.json({ error: "scheduleId, startTime, endTime required" }, { status: 400 });
  }
  await sql`
    INSERT INTO shifts (schedule_id, physician_id, start_time, end_time, type, location)
    VALUES (
      ${scheduleId},
      ${physicianId || null},
      ${startTime}::timestamptz,
      ${endTime}::timestamptz,
      ${(type || "call")}::shift_type,
      ${location || null}
    )
  `;
  return NextResponse.json({ ok: true });
}
