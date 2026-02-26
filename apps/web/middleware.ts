import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/physician/:path*",
    "/onboarding/:path*",
    "/api/profile/:path*",
    "/api/physicians/:path*",
    "/api/schedules/:path*",
    "/api/shifts/:path*",
    "/api/open-shifts/:path*",
    "/api/pickups/:path*",
    "/api/swaps/:path*",
    "/api/notifications",
  ],
};
