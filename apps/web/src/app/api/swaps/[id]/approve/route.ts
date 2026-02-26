import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { auth } = await import("@/lib/auth/server");
  const { data: session } = await auth.getSession();
  const adminId = session?.user?.id;

  const { id } = await params;
  const body = await req.json();
  const approved = body.approved === true;

  const ssrRows = await sql`
    SELECT ssr.id, ssr.shift_a_id, ssr.shift_b_id, ssr.physician_a_id, ssr.physician_b_id, ssr.status
    FROM shift_swap_requests ssr WHERE ssr.id = ${id}
  `;
  const ssr = ssrRows[0];
  if (!ssr) return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
  if (ssr.status !== "pending") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  const newStatus = approved ? "approved" : "rejected";
  await sql`
    UPDATE shift_swap_requests SET status = ${newStatus}::swap_status, admin_id = ${adminId}, admin_approved_at = NOW()
    WHERE id = ${id}
  `;

  if (!approved) {
    const { notifyUser } = await import("@/lib/notify");
    const physARows = await sql`SELECT user_id FROM physicians WHERE id = ${ssr.physician_a_id}`;
    const physBRows = await sql`SELECT user_id FROM physicians WHERE id = ${ssr.physician_b_id}`;
    if (physARows[0]) await notifyUser(physARows[0].user_id, "swap_rejected", "Swap rejected", "Your shift swap was rejected.");
    if (physBRows[0]) await notifyUser(physBRows[0].user_id, "swap_rejected", "Swap rejected", "The shift swap was rejected.");
  } else {
    const { notifyUser } = await import("@/lib/notify");
    const physARows = await sql`SELECT user_id FROM physicians WHERE id = ${ssr.physician_a_id}`;
    const physBRows = await sql`SELECT user_id FROM physicians WHERE id = ${ssr.physician_b_id}`;
    if (physARows[0]) await notifyUser(physARows[0].user_id, "swap_approved", "Swap approved", "Your shift swap was approved.");
    if (physBRows[0]) await notifyUser(physBRows[0].user_id, "swap_approved", "Swap approved", "Your shift swap was approved.");
    await sql`UPDATE shifts SET physician_id = ${ssr.physician_b_id} WHERE id = ${ssr.shift_a_id}`;
    await sql`UPDATE shifts SET physician_id = ${ssr.physician_a_id} WHERE id = ${ssr.shift_b_id}`;
    await sql`
      INSERT INTO roster_events (event_type, entity_id, payload)
      VALUES ('approve'::roster_event_type, ${id}, ${JSON.stringify({
        type: "swap",
        swapRequestId: id,
        physicianAId: ssr.physician_a_id,
        physicianBId: ssr.physician_b_id,
        shiftAId: ssr.shift_a_id,
        shiftBId: ssr.shift_b_id,
      })}::jsonb)
    `;
  }

  return NextResponse.json({ ok: true });
}
