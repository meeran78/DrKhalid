"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile) {
          router.replace("/onboarding");
          return;
        }
        if (data.profile.role !== "admin") {
          router.replace("/physician");
          return;
        }
        setProfile(data.profile);
      })
      .catch(() => router.replace("/auth/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-slate-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          <Link href="/admin" className="font-medium text-slate-800">
            Schedules
          </Link>
          <Link href="/admin/approvals" className="text-slate-600 hover:text-slate-800">
            Approvals
          </Link>
          <Link href="/admin/physicians" className="text-slate-600 hover:text-slate-800">
            Physicians
          </Link>
          <Link href="/admin/ai-schedule" className="text-slate-600 hover:text-slate-800">
            AI Schedule
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/roster" className="text-sm text-slate-500">Call Center Roster</Link>
          <button
            onClick={() => authClient.signOut().then(() => router.push("/"))}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
