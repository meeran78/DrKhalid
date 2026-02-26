import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Token endpoint for mobile clients.
 * Signs in with email/password and returns a JWT-style token for API auth.
 * Uses the session token from Better Auth when available.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }
  const { data, error } = await auth.signIn.email({ email, password });
  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message || "Invalid credentials" }, { status: 401 });
  }
  const token = (data as { token?: string }).token ?? data.user.id;
  return NextResponse.json({ token });
}
