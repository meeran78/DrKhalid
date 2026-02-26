import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Physician Scheduling Platform
      </h1>
      <p className="text-slate-600 mb-8 max-w-md text-center">
        Manage physician schedules, drop shifts, pick up open shifts, and swap
        calls with admin approval.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/sign-in"
          className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          Sign In
        </Link>
        <Link
          href="/auth/sign-up"
          className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
