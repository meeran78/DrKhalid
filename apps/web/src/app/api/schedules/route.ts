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
  const rows = await sql`
    SELECT id, name, start_date, end_date, status, created_by, created_at
    FROM schedules
    ORDER BY start_date DESC
  `;
  return NextResponse.json({
    schedules: rows.map((r) => ({
      id: r.id,
      name: r.name,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      createdBy: r.created_by,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, startDate, endDate } = body;
  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: "name, startDate, endDate required" }, { status: 400 });
  }
  const { auth } = await import("@/lib/auth/server");
  const { data: session } = await auth.getSession();
  const rows = await sql`
    INSERT INTO schedules (name, start_date, end_date, status, created_by)
    VALUES (${name.trim()}, ${startDate}::date, ${endDate}::date, 'draft'::schedule_status, ${session?.user?.id ?? null})
    RETURNING id, name, start_date, end_date, status
  `;
  return NextResponse.json({ schedule: rows[0] });
}
