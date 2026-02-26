import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, requireAdmin, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await sql`
    SELECT p.id, p.user_id, p.name, p.email, p.specialties, p.max_shifts_per_week
    FROM physicians p
    ORDER BY p.name
  `;
  return NextResponse.json({
    physicians: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      specialties: r.specialties || [],
      maxShiftsPerWeek: r.max_shifts_per_week,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const body = await req.json();
  const { userId, name, email, specialties, maxShiftsPerWeek } = body;
  if (!userId || !name?.trim()) {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }
  try {
    await sql`
      INSERT INTO physicians (user_id, name, email, specialties, max_shifts_per_week)
      VALUES (
        ${userId},
        ${name.trim()},
        ${email || null},
        ${specialties ? (Array.isArray(specialties) ? specialties : [specialties]) : []},
        ${maxShiftsPerWeek ?? 5}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
