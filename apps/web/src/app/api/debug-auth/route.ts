import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint to verify Neon Auth connectivity.
 * GET /api/debug-auth - Returns status of direct connection to Neon Auth service.
 */
export async function GET() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({
      ok: false,
      error: "NEON_AUTH_BASE_URL not set",
    });
  }
  try {
    const url = `${baseUrl.replace(/\/$/, "")}/get-session`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url,
      bodyPreview: body ? body.slice(0, 200) : "(empty)",
      headers: Object.fromEntries(
        ["x-neon-ret-request-id", "content-type"].map((k) => [
          k,
          res.headers.get(k) ?? null,
        ])
      ),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
