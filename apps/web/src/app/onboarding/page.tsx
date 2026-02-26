"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Role = "admin" | "physician";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("physician");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    authClient.getSession().then((res) => {
      const data = res && "data" in res ? res.data : null;
      const user = data?.user;
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.profile) {
            router.replace(
              data.profile.role === "admin" ? "/admin" : "/physician"
            );
          }
        });
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: role === "physician" ? name : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create profile");
      }
      router.replace(role === "admin" ? "/admin" : "/physician");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-slate-200"
      >
        <h1 className="text-xl font-semibold text-slate-800 mb-6">
          Complete your profile
        </h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            I am a
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="physician"
                checked={role === "physician"}
                onChange={() => setRole("physician")}
              />
              <span>Physician</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
              <span>Admin</span>
            </label>
          </div>
        </div>
        {role === "physician" && (
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
