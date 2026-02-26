import { sql } from "@/lib/db";

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body?: string
) {
  await sql`
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (${userId}, ${type}, ${title}, ${body || null})
  `;
}

export async function notifyAdmins(type: string, title: string, body?: string) {
  const rows = await sql`SELECT user_id FROM profiles WHERE role = 'admin'`;
  for (const r of rows) {
    await notifyUser(r.user_id, type, title, body);
  }
}

export async function notifyPhysicians(type: string, title: string, body?: string) {
  const rows = await sql`SELECT user_id FROM physicians`;
  for (const r of rows) {
    await notifyUser(r.user_id, type, title, body);
  }
}
