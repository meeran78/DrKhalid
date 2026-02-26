"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type RosterShift = {
  id: string;
  physicianName: string | null;
  startTime: string;
  endTime: string;
  type: string;
};

export default function CallCenterRosterPage() {
  const [shifts, setShifts] = useState<RosterShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch("/api/roster")
        .then((r) => r.json())
        .then((data) => setShifts(data.shifts || []))
        .finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const upcoming = shifts.filter((s) => new Date(s.endTime) >= now).slice(0, 50);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Call Center Roster</h1>
      <p className="text-slate-500 text-sm mb-6">
        Live view of who is on call. Updates every 10 seconds.
      </p>
      {loading ? (
        <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Physician</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Start</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">End</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Type</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{s.physicianName || "Unassigned"}</td>
                  <td className="px-4 py-3 text-slate-600">{format(new Date(s.startTime), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-3 text-slate-600">{format(new Date(s.endTime), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-3 text-slate-600">{s.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
