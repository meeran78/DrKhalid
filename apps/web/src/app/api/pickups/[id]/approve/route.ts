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

  const sprRows = await sql`
    SELECT spr.id, spr.open_shift_request_id, spr.requested_by_physician_id, spr.status,
           osr.shift_id
    FROM shift_pickup_requests spr
    JOIN open_shift_requests osr ON osr.id = spr.open_shift_request_id
    WHERE spr.id = ${id}
  `;
  const spr = sprRows[0];
  if (!spr) return NextResponse.json({ error: "Pickup request not found" }, { status: 404 });
  if (spr.status !== "pending") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  const newStatus = approved ? "approved" : "rejected";
  await sql`
    UPDATE shift_pickup_requests SET status = ${newStatus}::pickup_status, approved_by_admin_id = ${adminId}
    WHERE id = ${id}
  `;

  if (approved) {
    const { notifyUser } = await import("@/lib/notify");
    const physRows = await sql`SELECT user_id FROM physicians WHERE id = ${spr.requested_by_physician_id}`;
    if (physRows[0]) {
      await notifyUser(physRows[0].user_id, "pickup_approved", "Pickup approved", "Your shift pickup request was approved.");
    }
    await sql`UPDATE shifts SET physician_id = ${spr.requested_by_physician_id} WHERE id = ${spr.shift_id}`;
    await sql`
      UPDATE open_shift_requests SET status = 'approved'::open_shift_status WHERE id = ${spr.open_shift_request_id}
    `;
    await sql`
      INSERT INTO roster_events (event_type, entity_id, payload)
      VALUES ('approve'::roster_event_type, ${id}, ${JSON.stringify({
        type: "pickup",
        pickupRequestId: id,
        physicianId: spr.requested_by_physician_id,
        shiftId: spr.shift_id,
      })}::jsonb)
    `;
  } else {
    const { notifyUser } = await import("@/lib/notify");
    const physRows = await sql`SELECT user_id FROM physicians WHERE id = ${spr.requested_by_physician_id}`;
    if (physRows[0]) {
      await notifyUser(physRows[0].user_id, "pickup_rejected", "Pickup rejected", "Your shift pickup request was rejected.");
    }
    await sql`
      UPDATE open_shift_requests SET status = 'rejected'::open_shift_status WHERE id = ${spr.open_shift_request_id}
    `;
  }

  return NextResponse.json({ ok: true });
}
