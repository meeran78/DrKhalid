"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function PhysicianLayout({
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
        if (data.profile.role !== "physician") {
          router.replace("/admin");
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
          <Link href="/physician" className="font-medium text-slate-800">
            My Schedule
          </Link>
          <Link href="/physician/open-shifts" className="text-slate-600 hover:text-slate-800">
            Open Shifts
          </Link>
          <Link href="/physician/swaps" className="text-slate-600 hover:text-slate-800">
            Swap Shifts
          </Link>
        </div>
        <button
          onClick={() => authClient.signOut().then(() => router.push("/"))}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Sign out
        </button>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
