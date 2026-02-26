"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

type Schedule = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedules")
      .then((r) => r.json())
      .then((data) => setSchedules(data.schedules || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">
        Schedules
      </h1>
      <Link
        href="/admin/schedules/new"
        className="inline-block mb-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
      >
        Create Schedule
      </Link>
      <div className="grid gap-4">
        {schedules.map((s) => (
          <Link
            key={s.id}
            href={`/admin/schedules/${s.id}`}
            className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-medium text-slate-800">{s.name}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {format(new Date(s.startDate), "MMM d, yyyy")} –{" "}
                  {format(new Date(s.endDate), "MMM d, yyyy")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  s.status === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {s.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
