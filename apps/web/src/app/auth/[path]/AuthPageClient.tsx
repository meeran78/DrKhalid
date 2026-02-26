"use client";

import { AuthView } from "@neondatabase/auth/react";

export function AuthPageClient({ path }: { path: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <AuthView path={path} />
      </div>
    </div>
  );
}
