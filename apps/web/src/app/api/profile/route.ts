import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await sql`
    SELECT id, user_id, role FROM profiles WHERE user_id = ${session.user.id}
  `;
  const profile = rows[0];
  if (!profile) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({
    profile: {
      id: profile.id,
      userId: profile.user_id,
      role: profile.role,
    },
  });
}

export async function POST(req: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const role = body.role as string;
  if (!role || !["admin", "physician"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const existing = await sql`
    SELECT id FROM profiles WHERE user_id = ${session.user.id}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 400 });
  }
  await sql`
    INSERT INTO profiles (user_id, role) VALUES (${session.user.id}, ${role}::user_role)
  `;
  if (role === "physician") {
    const name = body.name as string;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required for physician" }, { status: 400 });
    }
    const profiles = await sql`
      SELECT id FROM profiles WHERE user_id = ${session.user.id}
    `;
    const profileId = profiles[0]?.id;
    if (profileId) {
      await sql`
        INSERT INTO physicians (user_id, name, email) VALUES (${session.user.id}, ${name.trim()}, ${session.user.email || null})
      `;
    }
  }
  return NextResponse.json({ ok: true });
}
