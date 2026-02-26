import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * GMED EHR sync placeholder.
 * When GMED API is available, implement:
 * - Call GMED API to update on-call roster
 * - Use FHIR R4 Schedule/Practitioner or vendor-specific endpoints
 * - On "Publish schedule" and "Approve swap", trigger this sync
 */
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

  const config = {
    gmedApiUrl: process.env.GMED_API_URL,
    gmedApiKey: process.env.GMED_API_KEY ? "(configured)" : "(not configured)",
  };

  if (!config.gmedApiUrl || !process.env.GMED_API_KEY) {
    return NextResponse.json({
      ok: false,
      message: "GMED integration not configured. Set GMED_API_URL and GMED_API_KEY in environment.",
      placeholder: true,
    });
  }

  // TODO: Implement actual GMED API call when vendor docs available
  return NextResponse.json({
    ok: true,
    message: "GMED sync placeholder. Implement when API available.",
    placeholder: true,
  });
}
