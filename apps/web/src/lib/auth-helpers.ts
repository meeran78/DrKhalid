import { auth } from "@/lib/auth/server";

export async function getSessionUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getProfile() {
  const user = await requireAuth();
  const { sql } = await import("@/lib/db");
  const rows = await sql`
    SELECT id, user_id, role FROM profiles WHERE user_id = ${user.id}
  `;
  return rows[0] ?? null;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin required");
  }
  return profile;
}

export async function requirePhysician() {
  const profile = await getProfile();
  if (!profile || profile.role !== "physician") {
    throw new Error("Physician required");
  }
  return profile;
}
