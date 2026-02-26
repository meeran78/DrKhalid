import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rows = await sql`
    SELECT s.id, s.schedule_id, s.physician_id, s.start_time, s.end_time, s.type, s.location
    FROM shifts s WHERE s.id = ${id}
  `;
  const shift = rows[0];
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ shift });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { physicianId, startTime, endTime, type, location } = body;
  const existing = await sql`SELECT * FROM shifts WHERE id = ${id}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const physicianIdVal = physicianId !== undefined ? physicianId : existing[0].physician_id;
  const startTimeVal = startTime !== undefined ? startTime : existing[0].start_time;
  const endTimeVal = endTime !== undefined ? endTime : existing[0].end_time;
  const typeVal = type !== undefined ? type : existing[0].type;
  const locationVal = location !== undefined ? location : existing[0].location;

  await sql`
    UPDATE shifts SET physician_id = ${physicianIdVal}, start_time = ${startTimeVal}::timestamptz,
    end_time = ${endTimeVal}::timestamptz, type = ${typeVal}::shift_type, location = ${locationVal}
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await sql`DELETE FROM shifts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
