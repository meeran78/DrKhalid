import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="animate-fade-in-up flex flex-col items-center max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 tracking-tight">
          Physician Scheduling Platform
        </h1>
        <p className="text-slate-600 mb-10 max-w-md text-lg leading-relaxed">
          Manage physician schedules, drop shifts, pick up open shifts, and swap
          calls with admin approval.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/sign-in"
            className="px-8 py-3.5 bg-slate-800 text-white font-medium rounded-lg shadow-md hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-out"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-8 py-3.5 bg-white text-slate-800 font-medium border-2 border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-out"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
