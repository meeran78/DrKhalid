import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";
import { validateSwap } from "@/lib/conflicts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  let rows;
  if (isAdmin) {
    rows = await sql`
      SELECT ssr.id, ssr.shift_a_id, ssr.shift_b_id, ssr.physician_a_id, ssr.physician_b_id, ssr.status,
             pa.name as physician_a_name, pb.name as physician_b_name,
             sa.start_time as shift_a_start, sa.end_time as shift_a_end,
             sb.start_time as shift_b_start, sb.end_time as shift_b_end
      FROM shift_swap_requests ssr
      JOIN physicians pa ON pa.id = ssr.physician_a_id
      JOIN physicians pb ON pb.id = ssr.physician_b_id
      JOIN shifts sa ON sa.id = ssr.shift_a_id
      JOIN shifts sb ON sb.id = ssr.shift_b_id
      ORDER BY ssr.created_at DESC
    `;
  } else {
    const physicianRows = await sql`SELECT id FROM physicians WHERE user_id = ${profile!.user_id}`;
    const physician = physicianRows[0];
    if (!physician) return NextResponse.json({ swaps: [] });
    rows = await sql`
      SELECT ssr.id, ssr.shift_a_id, ssr.shift_b_id, ssr.physician_a_id, ssr.physician_b_id, ssr.status,
             pa.name as physician_a_name, pb.name as physician_b_name,
             sa.start_time as shift_a_start, sa.end_time as shift_a_end,
             sb.start_time as shift_b_start, sb.end_time as shift_b_end
      FROM shift_swap_requests ssr
      JOIN physicians pa ON pa.id = ssr.physician_a_id
      JOIN physicians pb ON pb.id = ssr.physician_b_id
      JOIN shifts sa ON sa.id = ssr.shift_a_id
      JOIN shifts sb ON sb.id = ssr.shift_b_id
      WHERE ssr.physician_a_id = ${physician.id} OR ssr.physician_b_id = ${physician.id}
      ORDER BY ssr.created_at DESC
    `;
  }

  return NextResponse.json({
    swaps: rows.map((r) => ({
      id: r.id,
      shiftAId: r.shift_a_id,
      shiftBId: r.shift_b_id,
      physicianAId: r.physician_a_id,
      physicianBId: r.physician_b_id,
      physicianAName: r.physician_a_name,
      physicianBName: r.physician_b_name,
      shiftAStart: r.shift_a_start,
      shiftAEnd: r.shift_a_end,
      shiftBStart: r.shift_b_start,
      shiftBEnd: r.shift_b_end,
      status: r.status,
    })),
  });
}

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
  const { shiftAId, shiftBId, physicianBId } = body;
  if (!shiftAId || !shiftBId || !physicianBId) {
    return NextResponse.json({ error: "shiftAId, shiftBId, physicianBId required" }, { status: 400 });
  }

  const shiftARows = await sql`
    SELECT s.id, s.physician_id, s.start_time, s.end_time
    FROM shifts s JOIN schedules sch ON sch.id = s.schedule_id
    WHERE s.id = ${shiftAId} AND sch.status = 'published'
  `;
  const shiftA = shiftARows[0];
  if (!shiftA) return NextResponse.json({ error: "Shift A not found" }, { status: 404 });
  if (shiftA.physician_id !== physician.id) {
    return NextResponse.json({ error: "Shift A must be your shift" }, { status: 403 });
  }

  const shiftBRows = await sql`
    SELECT s.id, s.physician_id, s.start_time, s.end_time
    FROM shifts s JOIN schedules sch ON sch.id = s.schedule_id
    WHERE s.id = ${shiftBId} AND sch.status = 'published'
  `;
  const shiftB = shiftBRows[0];
  if (!shiftB) return NextResponse.json({ error: "Shift B not found" }, { status: 404 });
  if (shiftB.physician_id !== physicianBId) {
    return NextResponse.json({ error: "Shift B must belong to the other physician" }, { status: 403 });
  }

  const validation = await validateSwap(
    physician.id,
    physicianBId,
    shiftA.start_time,
    shiftA.end_time,
    shiftB.start_time,
    shiftB.end_time
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await sql`
    INSERT INTO shift_swap_requests (shift_a_id, shift_b_id, physician_a_id, physician_b_id, status)
    VALUES (${shiftAId}, ${shiftBId}, ${physician.id}, ${physicianBId}, 'pending'::swap_status)
  `;
  const { notifyUser, notifyAdmins } = await import("@/lib/notify");
  const physARows = await sql`SELECT name FROM physicians WHERE id = ${physician.id}`;
  const physBRows = await sql`SELECT user_id FROM physicians WHERE id = ${physicianBId}`;
  if (physBRows[0]) {
    await notifyUser(physBRows[0].user_id, "swap_request", "Swap requested", `${physARows[0]?.name || "A physician"} wants to swap shifts with you.`);
  }
  await notifyAdmins("swap_request", "Swap requested", "A physician requested a shift swap.");
  return NextResponse.json({ ok: true });
}
