import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: session } = await (await import("@/lib/auth/server")).auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, type, title, body, read, created_at FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return NextResponse.json({
    notifications: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      read: r.read,
      createdAt: r.created_at,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: session } = await (await import("@/lib/auth/server")).auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { read, id } = body;
  if (id) {
    await sql`UPDATE notifications SET read = ${!!read} WHERE id = ${id} AND user_id = ${userId}`;
  } else {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${userId}`;
  }
  return NextResponse.json({ ok: true });
}
