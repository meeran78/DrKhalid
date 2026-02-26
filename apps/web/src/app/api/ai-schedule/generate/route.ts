import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
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

  const physicians = await sql`SELECT id, max_shifts_per_week FROM physicians`;
  if (physicians.length === 0) {
    return NextResponse.json({ error: "No physicians. Add physicians first." }, { status: 400 });
  }

  const blackouts = await sql`
    SELECT physician_id, start_date, end_date FROM blackout_dates
    WHERE end_date >= ${startDate}::date AND start_date <= ${endDate}::date
  `;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const slots: { date: Date; type: "call" }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) slots.push({ date: new Date(d), type: "call" });
  }

  const { auth } = await import("@/lib/auth/server");
  const { data: session } = await auth.getSession();
  const scheduleRows = await sql`
    INSERT INTO schedules (name, start_date, end_date, status, created_by)
    VALUES (${name.trim()}, ${startDate}, ${endDate}, 'draft'::schedule_status, ${session?.user?.id ?? null})
    RETURNING id
  `;
  const scheduleId = scheduleRows[0].id;

  const isBlackedOut = (physicianId: string, d: Date) => {
    const dStr = d.toISOString().slice(0, 10);
    return blackouts.some(
      (b) =>
        b.physician_id === physicianId &&
        dStr >= b.start_date &&
        dStr <= b.end_date
    );
  };

  const counts = new Map<string, number>();
  physicians.forEach((p) => counts.set(p.id, 0));

  let idx = 0;
  for (const slot of slots) {
    const maxPerPhysician = 5;
    let assigned = false;
    for (let i = 0; i < physicians.length; i++) {
      const p = physicians[(idx + i) % physicians.length];
      const c = counts.get(p.id) ?? 0;
      const max = (p.max_shifts_per_week ?? maxPerPhysician) * 4;
      if (!isBlackedOut(p.id, slot.date) && c < max) {
        const slotStart = new Date(slot.date);
        slotStart.setHours(7, 0, 0, 0);
        const slotEnd = new Date(slot.date);
        slotEnd.setHours(19, 0, 0, 0);
        await sql`
          INSERT INTO shifts (schedule_id, physician_id, start_time, end_time, type)
          VALUES (${scheduleId}, ${p.id}, ${slotStart.toISOString()}, ${slotEnd.toISOString()}, 'call'::shift_type)
        `;
        counts.set(p.id, (counts.get(p.id) ?? 0) + 1);
        idx = (idx + i + 1) % physicians.length;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const slotStart = new Date(slot.date);
      slotStart.setHours(7, 0, 0, 0);
      const slotEnd = new Date(slot.date);
      slotEnd.setHours(19, 0, 0, 0);
      await sql`
        INSERT INTO shifts (schedule_id, physician_id, start_time, end_time, type)
        VALUES (${scheduleId}, ${null}, ${slotStart.toISOString()}, ${slotEnd.toISOString()}, 'call'::shift_type)
      `;
    }
  }

  return NextResponse.json({ scheduleId, ok: true });
}
