"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type OpenShift = {
  id: string;
  shiftId: string;
  startTime: string;
  endTime: string;
  type: string;
  location: string | null;
  scheduleName: string;
  droppedByName: string;
};

export default function OpenShiftsPage() {
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/open-shifts")
      .then((r) => r.json())
      .then((data) => setOpenShifts(data.openShifts || []))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestPickup = async (openShiftRequestId: string) => {
    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openShiftRequestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      alert("Pickup requested. Pending admin approval.");
      setOpenShifts((s) => s.filter((x) => x.id !== openShiftRequestId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-lg" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Open Shifts</h1>
      <p className="text-slate-600 mb-6">
        These shifts are available to pick up. Request one and wait for admin approval.
      </p>
      {openShifts.length === 0 ? (
        <p className="text-slate-500">No open shifts</p>
      ) : (
        <div className="space-y-4">
          {openShifts.map((os) => (
            <div
              key={os.id}
              className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {format(new Date(os.startTime), "EEEE, MMM d")}
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(os.startTime), "h:mm a")} – {format(new Date(os.endTime), "h:mm a")} · {os.type}
                  {os.location && ` · ${os.location}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {os.scheduleName} · Dropped by {os.droppedByName}
                </p>
              </div>
              <button
                onClick={() => handleRequestPickup(os.id)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Request Pickup
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
